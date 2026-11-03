import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  getCountFromServer,
  collectionGroup,
  Timestamp,
  query,
  where,
  addDoc,
  type Query,
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
import { normalizeAdminAccountStatus } from "@/types/admin";
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
    const usersRef = collection(db, "users");
    const [usersCount, convosCount, msgsCount, onlineCount, disabledCount, openReportsCount, series] = await Promise.all([
      getCountFromServer(usersRef),
      getCountFromServer(collection(db, "conversations")),
      getCountFromServer(collectionGroup(db, "messages")),
      getCountFromServer(query(usersRef, where("status", "in", ["online", "active"]))),
      getCountFromServer(query(usersRef, where("isDisabled", "==", true))),
      getCountFromServer(query(collection(db, "reports"), where("status", "==", "open"))),
      fetchStatisticsSeries(),
    ]);
    const messageVolume = series.messageVolume;

    return {
      totalUsers: usersCount.data().count,
      activeUsers: Math.max(0, usersCount.data().count - disabledCount.data().count),
      onlineUsers: onlineCount.data().count,
      totalConversations: convosCount.data().count,
      totalMessages: msgsCount.data().count,
      messagesToday: messageVolume[messageVolume.length - 1]?.value ?? 0,
      messagesThisWeek: messageVolume.reduce((total, point) => total + point.value, 0),
      openReports: openReportsCount.data().count,
      blockedUsers: disabledCount.data().count,
      storageUsageBytes: null,
      storageQuotaBytes: null,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Charts & Series (الرسومات البيانية)
// ---------------------------------------------------------------------------

export async function fetchOverviewSeries() {
  const series = await fetchStatisticsSeries();
  return { messageVolume: series.messageVolume, activeUsers: series.activeUsers };
}

export async function fetchStatisticsSeries() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });
    const weeks = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (7 * (7 - index)));
      return date;
    });
    const usersRef = collection(db, "users");
    const messagesRef = collectionGroup(db, "messages");
    const conversationsRef = collection(db, "conversations");
    const reportsRef = collection(db, "reports");
    const nextDay = (start: Date) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const nextWeek = (start: Date) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    const countRange = async (target: Query, field: string, start: Date, end: Date) => {
      const result = await getCountFromServer(query(
        target,
        where(field, ">=", Timestamp.fromDate(start)),
        where(field, "<", Timestamp.fromDate(end))
      ));
      return result.data().count;
    };
    const [activeCounts, messageCounts, userGrowth, newConversations, reportCounts, blockedCount] = await Promise.all([
      Promise.all(days.map((date) => countRange(usersRef, "lastSeenAt", date, nextDay(date)))),
      Promise.all(days.map((date) => countRange(messagesRef, "createdAt", date, nextDay(date)))),
      Promise.all(weeks.map((date) => countRange(usersRef, "createdAt", date, nextWeek(date)))),
      Promise.all(weeks.map((date) => countRange(conversationsRef, "createdAt", date, nextWeek(date)))),
      Promise.all(weeks.map((date) => countRange(reportsRef, "createdAt", date, nextWeek(date)))),
      getCountFromServer(query(usersRef, where("isDisabled", "==", true))).then((result) => result.data().count),
    ]);
    const dayPoints = (counts: number[]) => counts.map((value, index) => ({
      label: days[index]!.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
    }));
    const weekPoints = (counts: number[]) => counts.map((value, index) => ({
      label: weeks[index]!.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
    }));

    return {
      userGrowth: weekPoints(userGrowth),
      activeUsers: dayPoints(activeCounts),
      messageVolume: dayPoints(messageCounts),
      newConversations: weekPoints(newConversations),
      reports: weekPoints(reportCounts),
      blockedUsers: [{ label: "Current", value: blockedCount }],
    };
  } catch (error) {
    console.error("Error fetching statistics series:", error);
    throw error;
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
      accountStatus: normalizeAdminAccountStatus(data.accountStatus, data.isDisabled),
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
        participantUserIds: data.memberUids || [],
        participantUids: data.memberUids || [],
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
      participantUserIds: data.memberUids || [],
      participantUids: data.memberUids || [],
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
    const snap = await getDocs(collection(db, "conversations", id, "messages"));
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