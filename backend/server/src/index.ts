import { Hono } from "hono";
import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { eq, and, desc, count, or } from "drizzle-orm";

export async function createApp(
  edgespark: Client<typeof tables>
): Promise<Hono> {
  const app = new Hono();

  // ============ ADMIN HELPER ============

  // Check if the current user is an admin/superadmin
  async function isAdmin(userId: string, email: string | null): Promise<{ isAdmin: boolean; role: string | null }> {
    const conditions = [eq(tables.admins.userId, userId)];
    if (email) conditions.push(eq(tables.admins.email, email));
    const result = await edgespark.db
      .select()
      .from(tables.admins)
      .where(or(...conditions));
    if (result.length > 0) {
      // If user_id was placeholder, update it with real user_id
      if (result[0].userId === '__placeholder_superuser__' && userId !== '__placeholder_superuser__') {
        await edgespark.db
          .update(tables.admins)
          .set({ userId })
          .where(eq(tables.admins.id, result[0].id));
      }
      return { isAdmin: true, role: result[0].role };
    }
    return { isAdmin: false, role: null };
  }

  // Admin check endpoint (authenticated users can check their admin status)
  app.get('/api/admin/check', async (c) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ isAdmin: false, role: null });
    console.log("[API] GET /api/admin/check - user:", user.id, user.email);
    const adminStatus = await isAdmin(user.id, user.email);
    return c.json(adminStatus);
  });

  // ============ PUBLIC ROUTES ============

  // Get all active properties (public)
  app.get('/api/public/properties', async (c) => {
    console.log("[API] GET /api/public/properties");
    const properties = await edgespark.db
      .select()
      .from(tables.properties)
      .where(eq(tables.properties.status, 'active'))
      .orderBy(desc(tables.properties.createdAt));
    return c.json({ data: properties });
  });

  // Get single property with room types (public)
  app.get('/api/public/properties/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    console.log("[API] GET /api/public/properties/" + id);
    const property = await edgespark.db
      .select()
      .from(tables.properties)
      .where(eq(tables.properties.id, id));
    if (property.length === 0) return c.json({ error: 'Not found' }, 404);

    const roomTypes = await edgespark.db
      .select()
      .from(tables.roomTypes)
      .where(and(
        eq(tables.roomTypes.propertyId, id),
        eq(tables.roomTypes.status, 'available')
      ));

    return c.json({ data: { ...property[0], roomTypes } });
  });

  // Submit inquiry (public)
  app.post('/api/public/inquiries', async (c) => {
    const data = await c.req.json();
    console.log("[API] POST /api/public/inquiries", { email: data.email });
    if (!data.name || !data.email || !data.subject || !data.message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    const inquiry = await edgespark.db
      .insert(tables.inquiries)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        userId: data.userId || null,
      })
      .returning();
    return c.json({ data: inquiry[0] }, 201);
  });

  // ============ AUTHENTICATED ROUTES ============

  // Create booking
  app.post('/api/bookings', async (c) => {
    const user = edgespark.auth.user!;
    const data = await c.req.json();
    console.log("[API] POST /api/bookings - user:", user.id);

    if (!data.propertyId || !data.roomTypeId || !data.checkIn || !data.checkOut) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate voucher code
    const voucherCode = 'SI-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const booking = await edgespark.db
      .insert(tables.bookings)
      .values({
        userId: user.id,
        propertyId: data.propertyId,
        roomTypeId: data.roomTypeId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests || 1,
        totalPrice: data.totalPrice || 0,
        currency: 'HKD',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: data.paymentMethod || null,
        specialRequests: data.specialRequests || null,
        voucherCode,
      })
      .returning();
    return c.json({ data: booking[0] }, 201);
  });

  // Get user's bookings
  app.get('/api/bookings', async (c) => {
    const user = edgespark.auth.user!;
    console.log("[API] GET /api/bookings - user:", user.id);
    const bookings = await edgespark.db
      .select()
      .from(tables.bookings)
      .where(eq(tables.bookings.userId, user.id))
      .orderBy(desc(tables.bookings.createdAt));
    return c.json({ data: bookings });
  });

  // Get single booking
  app.get('/api/bookings/:id', async (c) => {
    const user = edgespark.auth.user!;
    const id = parseInt(c.req.param('id'));
    const booking = await edgespark.db
      .select()
      .from(tables.bookings)
      .where(and(
        eq(tables.bookings.id, id),
        eq(tables.bookings.userId, user.id)
      ));
    if (booking.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: booking[0] });
  });

  // Cancel booking
  app.patch('/api/bookings/:id/cancel', async (c) => {
    const user = edgespark.auth.user!;
    const id = parseInt(c.req.param('id'));
    console.log("[API] PATCH /api/bookings/" + id + "/cancel - user:", user.id);
    
    const existing = await edgespark.db
      .select()
      .from(tables.bookings)
      .where(and(
        eq(tables.bookings.id, id),
        eq(tables.bookings.userId, user.id)
      ));
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);
    if (existing[0].status === 'cancelled') return c.json({ error: 'Already cancelled' }, 400);

    const updated = await edgespark.db
      .update(tables.bookings)
      .set({ status: 'cancelled', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(tables.bookings.id, id))
      .returning();
    return c.json({ data: updated[0] });
  });

  // ============ TRIP PLANS ============

  // Create trip plan
  app.post('/api/trip-plans', async (c) => {
    const user = edgespark.auth.user!;
    const data = await c.req.json();
    console.log("[API] POST /api/trip-plans - user:", user.id);
    const plan = await edgespark.db
      .insert(tables.tripPlans)
      .values({
        userId: user.id,
        name: data.name || '我的行程',
        destination: data.destination || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        items: data.items ? JSON.stringify(data.items) : null,
        notes: data.notes || null,
        status: 'draft',
      })
      .returning();
    return c.json({ data: plan[0] }, 201);
  });

  // Get user's trip plans
  app.get('/api/trip-plans', async (c) => {
    const user = edgespark.auth.user!;
    const plans = await edgespark.db
      .select()
      .from(tables.tripPlans)
      .where(eq(tables.tripPlans.userId, user.id))
      .orderBy(desc(tables.tripPlans.createdAt));
    return c.json({ data: plans });
  });

  // Update trip plan
  app.put('/api/trip-plans/:id', async (c) => {
    const user = edgespark.auth.user!;
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    
    const existing = await edgespark.db
      .select()
      .from(tables.tripPlans)
      .where(and(
        eq(tables.tripPlans.id, id),
        eq(tables.tripPlans.userId, user.id)
      ));
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);

    const updated = await edgespark.db
      .update(tables.tripPlans)
      .set({
        name: data.name || existing[0].name,
        destination: data.destination ?? existing[0].destination,
        startDate: data.startDate ?? existing[0].startDate,
        endDate: data.endDate ?? existing[0].endDate,
        items: data.items ? JSON.stringify(data.items) : existing[0].items,
        notes: data.notes ?? existing[0].notes,
        status: data.status || existing[0].status,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(tables.tripPlans.id, id))
      .returning();
    return c.json({ data: updated[0] });
  });

  // Delete trip plan
  app.delete('/api/trip-plans/:id', async (c) => {
    const user = edgespark.auth.user!;
    const id = parseInt(c.req.param('id'));
    const existing = await edgespark.db
      .select()
      .from(tables.tripPlans)
      .where(and(
        eq(tables.tripPlans.id, id),
        eq(tables.tripPlans.userId, user.id)
      ));
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);
    await edgespark.db.delete(tables.tripPlans).where(eq(tables.tripPlans.id, id));
    return c.json({ success: true });
  });

  // ============ ADMIN ROUTES ============

  // Admin middleware - protect all admin data routes
  app.use('/api/admin/bookings', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/bookings/*', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/inquiries', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/inquiries/*', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/properties', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/properties/*', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/room-types', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });
  app.use('/api/admin/room-types/*', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin) return c.json({ error: 'Forbidden: Admin access required' }, 403);
    await next();
  });

  // Admin: Get all bookings
  app.get('/api/admin/bookings', async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const bookings = await edgespark.db
      .select()
      .from(tables.bookings)
      .orderBy(desc(tables.bookings.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await edgespark.db
      .select({ count: count() })
      .from(tables.bookings);

    return c.json({ data: bookings, total: total[0].count, page, limit });
  });

  // Admin: Update booking status
  app.patch('/api/admin/bookings/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    console.log("[API] PATCH /api/admin/bookings/" + id, data);
    
    const updated = await edgespark.db
      .update(tables.bookings)
      .set({
        status: data.status,
        paymentStatus: data.paymentStatus,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(tables.bookings.id, id))
      .returning();
    if (updated.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated[0] });
  });

  // Admin: Get all inquiries
  app.get('/api/admin/inquiries', async (c) => {
    const inquiries = await edgespark.db
      .select()
      .from(tables.inquiries)
      .orderBy(desc(tables.inquiries.createdAt));
    return c.json({ data: inquiries });
  });

  // Admin: Reply to inquiry
  app.patch('/api/admin/inquiries/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    console.log("[API] PATCH /api/admin/inquiries/" + id);
    
    const updated = await edgespark.db
      .update(tables.inquiries)
      .set({
        status: data.status || 'replied',
        adminReply: data.adminReply,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(tables.inquiries.id, id))
      .returning();
    if (updated.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated[0] });
  });

  // Admin: Manage properties
  app.post('/api/admin/properties', async (c) => {
    const data = await c.req.json();
    console.log("[API] POST /api/admin/properties", { name: data.name });
    const property = await edgespark.db
      .insert(tables.properties)
      .values({
        name: data.name,
        nameZh: data.nameZh,
        description: data.description || null,
        descriptionZh: data.descriptionZh || null,
        location: data.location || null,
        pricePerNight: data.pricePerNight || 0,
        maxGuests: data.maxGuests || 2,
        imageUrl: data.imageUrl || null,
        gallery: data.gallery ? JSON.stringify(data.gallery) : null,
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
      })
      .returning();
    return c.json({ data: property[0] }, 201);
  });

  // Admin: Update property
  app.put('/api/admin/properties/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    const updated = await edgespark.db
      .update(tables.properties)
      .set({
        ...data,
        gallery: data.gallery ? JSON.stringify(data.gallery) : undefined,
        amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(tables.properties.id, id))
      .returning();
    if (updated.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated[0] });
  });

  // Admin: Manage room types
  app.post('/api/admin/room-types', async (c) => {
    const data = await c.req.json();
    console.log("[API] POST /api/admin/room-types", { name: data.name });
    const roomType = await edgespark.db
      .insert(tables.roomTypes)
      .values({
        propertyId: data.propertyId,
        name: data.name,
        nameZh: data.nameZh,
        description: data.description || null,
        descriptionZh: data.descriptionZh || null,
        pricePerNight: data.pricePerNight || 0,
        maxGuests: data.maxGuests || 2,
        inventory: data.inventory || 1,
        imageUrl: data.imageUrl || null,
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
      })
      .returning();
    return c.json({ data: roomType[0] }, 201);
  });

  // Admin: Update room type inventory
  app.patch('/api/admin/room-types/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    const updated = await edgespark.db
      .update(tables.roomTypes)
      .set({
        inventory: data.inventory,
        status: data.status,
        pricePerNight: data.pricePerNight,
      })
      .where(eq(tables.roomTypes.id, id))
      .returning();
    if (updated.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated[0] });
  });

  // ============ ADMIN ACCOUNTS MANAGEMENT (Superadmin only) ============

  // Superadmin middleware for accounts routes
  app.use('/api/admin/accounts', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin || adminStatus.role !== 'superadmin') {
      return c.json({ error: 'Forbidden: Superadmin access required' }, 403);
    }
    await next();
  });
  app.use('/api/admin/accounts/*', async (c, next) => {
    const user = edgespark.auth.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const adminStatus = await isAdmin(user.id, user.email);
    if (!adminStatus.isAdmin || adminStatus.role !== 'superadmin') {
      return c.json({ error: 'Forbidden: Superadmin access required' }, 403);
    }
    await next();
  });

  // Get all admin accounts
  app.get('/api/admin/accounts', async (c) => {
    console.log("[API] GET /api/admin/accounts");
    const admins = await edgespark.db
      .select()
      .from(tables.admins)
      .orderBy(desc(tables.admins.createdAt));
    return c.json({ data: admins });
  });

  // Add new admin account
  app.post('/api/admin/accounts', async (c) => {
    const data = await c.req.json();
    console.log("[API] POST /api/admin/accounts", { email: data.email });

    if (!data.email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if admin already exists
    const existing = await edgespark.db
      .select()
      .from(tables.admins)
      .where(eq(tables.admins.email, data.email));
    if (existing.length > 0) {
      return c.json({ error: 'Admin with this email already exists' }, 409);
    }

    const newAdmin = await edgespark.db
      .insert(tables.admins)
      .values({
        userId: data.userId || '__placeholder__' + Date.now(),
        email: data.email,
        role: data.role || 'admin',
      })
      .returning();
    return c.json({ data: newAdmin[0] }, 201);
  });

  // Update admin role
  app.patch('/api/admin/accounts/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    console.log("[API] PATCH /api/admin/accounts/" + id, data);

    if (!data.role || !['admin', 'superadmin'].includes(data.role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    const updated = await edgespark.db
      .update(tables.admins)
      .set({ role: data.role })
      .where(eq(tables.admins.id, id))
      .returning();
    if (updated.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: updated[0] });
  });

  // Delete admin account
  app.delete('/api/admin/accounts/:id', async (c) => {
    const user = edgespark.auth.user!;
    const id = parseInt(c.req.param('id'));
    console.log("[API] DELETE /api/admin/accounts/" + id);

    // Prevent deleting own account
    const target = await edgespark.db
      .select()
      .from(tables.admins)
      .where(eq(tables.admins.id, id));
    if (target.length === 0) return c.json({ error: 'Not found' }, 404);
    if (target[0].email === user.email) {
      return c.json({ error: 'Cannot delete your own admin account' }, 400);
    }

    await edgespark.db.delete(tables.admins).where(eq(tables.admins.id, id));
    return c.json({ success: true });
  });

  // User profile
  app.get('/api/profile', async (c) => {
    const user = edgespark.auth.user!;
    return c.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  });

  return app;
}
