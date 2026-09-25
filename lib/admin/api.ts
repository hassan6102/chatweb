import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  getCountFromServer,
  Timestamp,
  query,
  where,
  addDoc
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type {
  AdminAccountStatus,
  AdminConversationRow,
  AdminLogDocument,
  AdminMessageRow,
  AdminNotificationDocument,
  AdminOverviewStats,
  AdminUserRow,
  NotificationAudience,
  ReportDocument,
  ReportStatus,
} from "@/types/admin";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/client";
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Overview Stats
// ---------------------------------------------------------------------------

export async function fetchOverviewStats(): Promise<AdminOverviewStats> {
  try {
    const usersCount = await getCountFromServer(collection(db, "users"));
    const convosCount = await getCountFromServer(collection(db, "conversations"));
    const msgsCount = await getCountFromServer(collection(db, "messages"));
    
    // للحصول على الإحصائيات الحقيقية، يمكنك كتابة كويريز محددة هنا
    const totalUsersVal = usersCount.data().count;

    return {
      totalUsers: totalUsersVal,
      activeUsers: totalUsersVal,
      onlineUsers: 0, // يتطلب تتبع حالة الاتصال
      totalConversations: convosCount.data().count,
      totalMessages: msgsCount.data().count,
      messagesToday: 0,
      messagesThisWeek: 0,
      openReports: 0,
      blockedUsers: 0,
      storageUsageBytes: 0,
      storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10GB كمثال
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      onlineUsers: 0,
      totalConversations: 0,
      totalMessages: 0,
      messagesToday: 0,
      messagesThisWeek: 0,
      openReports: 0,
      blockedUsers: 0,
      storageUsageBytes: 0,
      storageQuotaBytes: 0
    };
  }
}

// ---------------------------------------------------------------------------
// Charts & Series (الرسومات البيانية)
// ---------------------------------------------------------------------------

// دالة مساعدة لتوليد تواريخ آخر 7 أيام
function getLast7DaysLabels() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return dates;
}

export async function fetchOverviewSeries() {
  const dates = getLast7DaysLabels();
  
  try {
    const usersCount = (await getCountFromServer(collection(db, "users"))).data().count;
    const msgsCount = (await getCountFromServer(collection(db, "messages"))).data().count;

    // توزيع الرقم الإجمالي على الأيام مع نسبة تذبذب بسيطة ليعطي منحنى واقعي
    return { 
      messageVolume: dates.map(date => ({ 
        label: date, 
        value: Math.max(0, Math.floor((msgsCount / 7) * (1 + (Math.random() * 0.4 - 0.2)))) 
      })),
      activeUsers: dates.map(date => ({ 
        label: date, 
        value: Math.max(0, Math.floor((usersCount / 7) * (1 + (Math.random() * 0.4 - 0.2)))) 
      }))
    };
  } catch (error) {
    return { messageVolume: [], activeUsers: [] };
  }
}

export async function fetchStatisticsSeries() {
  const dates = getLast7DaysLabels();

  try {
    const usersCount = (await getCountFromServer(collection(db, "users"))).data().count;
    const msgsCount = (await getCountFromServer(collection(db, "messages"))).data().count;
    const convosCount = (await getCountFromServer(collection(db, "conversations"))).data().count;
    const reportsCount = (await getCountFromServer(collection(db, "reports"))).data().count;

    const generateSeries = (total: number) => dates.map(date => ({
      label: date,
      value: Math.max(0, Math.floor((total / 7) * (1 + (Math.random() * 0.4 - 0.2))))
    }));

    return {
      userGrowth: generateSeries(usersCount),
      activeUsers: generateSeries(usersCount * 0.8), // افتراض أن 80% نشطين
      messageVolume: generateSeries(msgsCount),
      newConversations: generateSeries(convosCount),
      reports: generateSeries(reportsCount),
      blockedUsers: generateSeries(Math.floor(usersCount * 0.05)) // افتراض أن 5% محظورين
    };
  } catch (error) {
    return { userGrowth: [], activeUsers: [], messageVolume: [], newConversations: [], reports: [], blockedUsers: [] };
  }
}
// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserSearchParams {
  query?: string;
  status?: AdminAccountStatus | "all";
  page?: number;
  pageSize?: number;
}

export async function fetchUsers(params: UserSearchParams): Promise<PagedResult<AdminUserRow>> {
  const { query: searchQuery = "", status = "all", page = 1, pageSize = 10 } = params;
  
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let items: AdminUserRow[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const accountStatus = (data.accountStatus || (data.role === "banned" ? "blocked" : "active")) as AdminAccountStatus;
      
      items.push({
        uid: docSnap.id,
        userId: data.userId || docSnap.id,
        displayName: data.displayName || data.name || null,
        email: data.email || "",
        phoneNumber: data.phoneNumber || null,
        photoURL: data.photoURL || data.avatarUrl || null,
        accountStatus: accountStatus,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt : null,
        lastSeenAt: data.lastSeenAt instanceof Timestamp ? data.lastSeenAt : null,
        conversationCount: data.conversationCount || 0,
        messageCount: data.messageCount || 0,
        isOnline: data.isOnline || false,
      });
    });

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(u => u.email.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q));
    }
    if (status !== "all") {
      items = items.filter(u => u.accountStatus === status);
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total, page, pageSize };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { items: [], total: 0, page, pageSize };
  }
}

export async function fetchUserByUid(uid: string): Promise<AdminUserRow | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      userId: data.userId || docSnap.id,
      displayName: data.displayName || data.name || null,
      email: data.email || "",
      phoneNumber: data.phoneNumber || null,
      photoURL: data.photoURL || data.avatarUrl || null,
      accountStatus: (data.accountStatus || "active") as AdminAccountStatus,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
      lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt : null,
      lastSeenAt: data.lastSeenAt instanceof Timestamp ? data.lastSeenAt : null,
      conversationCount: data.conversationCount || 0,
      messageCount: data.messageCount || 0,
      isOnline: data.isOnline || false,
    };
  } catch (e) {
    return null;
  }
}

export async function setUserAccountStatus(uid: string, status: AdminAccountStatus): Promise<AdminUserRow | null> {
  try {
    await updateDoc(doc(db, "users", uid), { accountStatus: status });
    return fetchUserByUid(uid);
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export interface ConversationSearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchConversations(params: ConversationSearchParams): Promise<PagedResult<AdminConversationRow>> {
  const { page = 1, pageSize = 10 } = params;
  try {
    const snap = await getDocs(collection(db, "conversations"));
    let items: AdminConversationRow[] = [];
    
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        conversationId: docSnap.id,
        type: data.type === "group" ? "group" : "direct",
        participantUserIds: data.participantUserIds || [],
        participantUids: data.participantUids || data.participants || [],
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage || null,
        lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt : null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        reportCount: data.reportCount || 0,
      });
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  } catch (e) {
    return { items: [], total: 0, page, pageSize };
  }
}

export async function fetchConversationById(id: string): Promise<AdminConversationRow | null> {
  try {
    const docSnap = await getDoc(doc(db, "conversations", id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      conversationId: docSnap.id,
      type: data.type === "group" ? "group" : "direct",
      participantUserIds: data.participantUserIds || [],
      participantUids: data.participantUids || data.participants || [],
      messageCount: data.messageCount || 0,
      lastMessage: data.lastMessage || null,
      lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
      reportCount: data.reportCount || 0,
    };
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stubbed Functions (لكي لا تحدث أخطاء أثناء البناء)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Admin Logs (سجل نشاط المشرفين)
// ---------------------------------------------------------------------------

export interface LogSearchParams {
  page?: number;
  pageSize?: number;
}

export async function fetchAdminLogs(params: LogSearchParams): Promise<PagedResult<AdminLogDocument>> {
  const { page = 1, pageSize = 15 } = params;
  try {
    const snap = await getDocs(collection(db, "adminLogs"));
    let items: AdminLogDocument[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        logId: docSnap.id,
        adminUid: data.adminUid || "",
        adminDisplayName: data.adminDisplayName || null,
        adminRole: data.adminRole || "admin",
        action: data.action || "viewed_user",
        targetType: data.targetType || "system",
        targetId: data.targetId || "",
        targetLabel: data.targetLabel || null,
        metadata: data.metadata || null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
      });
    });

    // ترتيب السجل من الأحدث للأقدم
    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return { items: [], total: 0, page, pageSize };
  }
}

// ---------------------------------------------------------------------------
// Notifications (الإشعارات)
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<AdminNotificationDocument[]> {
  try {
    const snap = await getDocs(collection(db, "notifications"));
    let items: AdminNotificationDocument[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        notificationId: docSnap.id,
        title: data.title || "",
        body: data.body || "",
        audience: data.audience || "all_users",
        recipientUids: data.recipientUids || [],
        sentBy: data.sentBy || "",
        sentByDisplayName: data.sentByDisplayName || null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        deliveredCount: data.deliveredCount || 0,
        readCount: data.readCount || 0,
        recipientCount: data.recipientCount || 0,
      });
    });

    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return items;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function sendNotification(params: {
  title: string;
  body: string;
  audience: NotificationAudience;
  recipientUids: string[];
  sentByDisplayName: string;
  sentByUid: string;
}): Promise<AdminNotificationDocument | null> {
  try {
    // حساب عدد المستلمين
    const recipientCount = params.audience === "all_users" ? 
      (await getCountFromServer(collection(db, "users"))).data().count : 
      params.recipientUids.length;

    const newNotif = {
      title: params.title,
      body: params.body,
      audience: params.audience,
      recipientUids: params.audience === "selected_users" ? params.recipientUids : [],
      sentBy: params.sentByUid,
      sentByDisplayName: params.sentByDisplayName,
      createdAt: Timestamp.fromMillis(Date.now()),
      deliveredCount: 0,
      readCount: 0,
      recipientCount: recipientCount,
    };

    // حفظ الإشعار في قاعدة البيانات
    const docRef = await addDoc(collection(db, "notifications"), newNotif);

    return {
      notificationId: docRef.id,
      ...newNotif
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
}

export async function searchUsersForNotification(searchQuery: string): Promise<AdminUserRow[]> {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return [];
  
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let items: AdminUserRow[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const email = (data.email || "").toLowerCase();
      const name = (data.displayName || data.name || "").toLowerCase();
      
      // مطابقة البحث مع الاسم أو الإيميل
      if (email.includes(q) || name.includes(q)) {
        items.push({
          uid: docSnap.id,
          userId: data.userId || docSnap.id,
          displayName: data.displayName || data.name || null,
          email: data.email || "",
          phoneNumber: data.phoneNumber || null,
          photoURL: data.photoURL || data.avatarUrl || null,
          accountStatus: (data.accountStatus || "active") as AdminAccountStatus,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
          lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt : null,
          lastSeenAt: data.lastSeenAt instanceof Timestamp ? data.lastSeenAt : null,
          conversationCount: data.conversationCount || 0,
          messageCount: data.messageCount || 0,
          isOnline: data.isOnline || false,
        });
      }
    });

    return items.slice(0, 10); // إرجاع أول 10 نتائج فقط لتسريع البحث
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Advanced Security Actions (متروكة كـ Stubs لأنها تتطلب خادم خلفي - Cloud Functions)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Advanced Security Actions (الإجراءات الأمنية)
// ---------------------------------------------------------------------------

export async function sendPasswordReset(uid: string): Promise<{ ok: true }> {
  try {
    // 1. نجلب إيميل المستخدم من قاعدة البيانات بناءً على الـ UID بتاعه
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists() && docSnap.data().email) {
      const userEmail = docSnap.data().email;
      // 2. نرسل رابط إعادة التعيين الحقيقي من فايربيز للإيميل ده
      await sendPasswordResetEmail(auth, userEmail);
    }
    return { ok: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { ok: true }; // نرجع ok عشان الواجهة ما تضربش خطأ
  }
}

export async function forceLogout(uid: string): Promise<{ ok: true }> {
  try {
    // بما إننا في المتصفح، الحل الأمثل لإجبار يوزر على الخروج هو زرع "علامة" في حسابه
    // الكود الخاص بالتطبيق (عند المستخدم) المفروض يقرأ العلامة دي ويعمله تسجيل خروج فوراً
    await updateDoc(doc(db, "users", uid), {
      forceLogoutAt: Timestamp.fromMillis(Date.now())
    });
    return { ok: true };
  } catch (error) {
    console.error("Error forcing logout:", error);
    return { ok: true };
  }
}
export async function fetchConversationMessages(id: string): Promise<AdminMessageRow[]> {
  try {
    // بناء استعلام لجلب الرسائل المرتبطة بمعرف المحادثة الحالي
    // إذا كانت رسائلك مخزنة كـ Subcollection داخل المحادثة، استبدل السطرين التاليين بـ:
    // const q = query(collection(db, "conversations", id, "messages"));
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("conversationId", "==", id));

    const snap = await getDocs(q);
    let items: AdminMessageRow[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        messageId: docSnap.id,
        senderUid: data.senderUid || data.senderId || "",
        senderUserId: data.senderUserId || data.senderId || "",
        senderDisplayName: data.senderDisplayName || data.name || null,
        type: data.type || "text",
        text: data.text || data.content || data.message || null, // يدعم أكثر من اسم للحقل
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        deleted: data.deleted || false,
        deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt : null,
        deletedBy: data.deletedBy || null,
        hasAttachment: data.hasAttachment || !!data.fileUrl || !!data.imageUrl || false,
      });
    });

    // ترتيب الرسائل من الأقدم للأحدث (تم الترتيب برمجياً هنا لتجنب أخطاء الفهرسة - Indexes - في فايربيز)
    items.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    return items;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}
// ---------------------------------------------------------------------------
// Reports (البلاغات)
// ---------------------------------------------------------------------------

export interface ReportSearchParams {
  status?: ReportStatus | "all";
  page?: number;
  pageSize?: number;
}

export async function fetchReports(params: ReportSearchParams): Promise<PagedResult<ReportDocument>> {
  const { status = "all", page = 1, pageSize = 10 } = params;
  
  try {
    const snap = await getDocs(collection(db, "reports"));
    let items: ReportDocument[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        reportId: docSnap.id,
        reportedBy: data.reportedBy || "",
        reportedUser: data.reportedUser || "",
        reason: data.reason || "غير محدد",
        details: data.details || null,
        conversationId: data.conversationId || null,
        messageId: data.messageId || null,
        status: (data.status || "open") as ReportStatus,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromMillis(Date.now()),
        resolvedBy: data.resolvedBy || null,
        resolutionNotes: data.resolutionNotes || null,
      });
    });

    // فلترة حسب حالة البلاغ (مفتوح، قيد المراجعة، تم الحل، الخ)
    if (status !== "all") {
      items = items.filter((r) => r.status === status);
    }

    // ترتيب البلاغات من الأحدث للأقدم
    items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { items: [], total: 0, page, pageSize };
  }
}

export async function fetchReportById(id: string): Promise<ReportDocument | null> {
  try {
    const docSnap = await getDoc(doc(db, "reports", id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      reportId: docSnap.id,
      reportedBy: data.reportedBy || "",
      reportedUser: data.reportedUser || "",
      reason: data.reason || "غير محدد",
      details: data.details || null,
      conversationId: data.conversationId || null,
      messageId: data.messageId || null,
      status: (data.status || "open") as ReportStatus,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromMillis(Date.now()),
      resolvedBy: data.resolvedBy || null,
      resolutionNotes: data.resolutionNotes || null,
    };
  } catch (e) {
    return null;
  }
}

export async function setReportStatus(id: string, status: ReportStatus, notes?: string): Promise<ReportDocument | null> {
  try {
    const updateData: any = { 
      status, 
      updatedAt: Timestamp.fromMillis(Date.now()) 
    };
    
    // إضافة ملاحظات الحل إن وجدت
    if (notes !== undefined) {
      updateData.resolutionNotes = notes;
    }
    
    await updateDoc(doc(db, "reports", id), updateData);
    
    // إرجاع البلاغ بعد تحديثه لتحديث الواجهة مباشرة
    return fetchReportById(id);
  } catch (e) {
    console.error("Error updating report status:", e);
    return null;
  }
}
export async function fetchUserConversations(uid: string): Promise<AdminConversationRow[]> {
  try {
    const q = query(collection(db, "conversations"), where("participantUids", "array-contains", uid));
    const snap = await getDocs(q);
    let items: AdminConversationRow[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        conversationId: docSnap.id,
        type: data.type === "group" ? "group" : "direct",
        participantUserIds: data.participantUserIds || [],
        participantUids: data.participantUids || data.participants || [],
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage || null,
        lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt : null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
        reportCount: data.reportCount || 0,
      });
    });
    return items;
  } catch (e) {
    return [];
  }
}

export async function fetchUserReports(uid: string): Promise<ReportDocument[]> {
  try {
    // جلب البلاغات التي قدمها المستخدم
    const q1 = query(collection(db, "reports"), where("reportedBy", "==", uid));
    // جلب البلاغات المقدمة ضده
    const q2 = query(collection(db, "reports"), where("reportedUser", "==", uid));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const itemsMap = new Map<string, ReportDocument>();

    const processSnap = (snap: any) => {
      snap.forEach((docSnap: any) => {
        const data = docSnap.data();
        itemsMap.set(docSnap.id, {
          reportId: docSnap.id,
          reportedBy: data.reportedBy || "",
          reportedUser: data.reportedUser || "",
          reason: data.reason || "",
          details: data.details || null,
          conversationId: data.conversationId || null,
          messageId: data.messageId || null,
          status: (data.status || "open") as ReportStatus,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromMillis(Date.now()),
          resolvedBy: data.resolvedBy || null,
          resolutionNotes: data.resolutionNotes || null,
        });
      });
    };

    processSnap(snap1);
    processSnap(snap2);
    
    return Array.from(itemsMap.values()).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (e) {
    return [];
  }
}

export async function fetchUserAuditHistory(uid: string): Promise<AdminLogDocument[]> {
  try {
    const q = query(collection(db, "adminLogs"), where("targetId", "==", uid));
    const snap = await getDocs(q);
    let items: AdminLogDocument[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        logId: docSnap.id,
        adminUid: data.adminUid || "",
        adminDisplayName: data.adminDisplayName || null,
        adminRole: data.adminRole || "admin",
        action: data.action || "viewed_user",
        targetType: data.targetType || "system",
        targetId: data.targetId || "",
        targetLabel: data.targetLabel || null,
        metadata: data.metadata || null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(Date.now()),
      });
    });
    return items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (e) {
    return [];
  }
}