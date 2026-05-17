import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Ban, BellRing, UserCog, Settings as SettingsIcon, Shield, BarChart3, Bot, Filter, Loader2, PlusCircle, Save, Database, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface AdminDashboardProps {
  section: string;
}

// قاموس لترجمة أسماء الحقول التقنية إلى أسماء عربية مفهومة
const FIELD_TRANSLATIONS: Record<string, string> = {
  idreg: "المعرف الرقمي",
  idroom: "رقم الغرفة",
  topic: "العنوان/الاسم",
  msg: "الرسالة/الوصف",
  pic: "الصورة",
  pich: "الغلاف",
  power: "الرتبة",
  muted: "مكتوم",
  lastssen: "آخر ظهور",
  joinuser: "تاريخ الانضمام",
  v: "القيمة/الكلمة",
  path: "المسار/النطاق",
  stat: "الحالة",
  ip: "عنوان IP",
  fp: "بصمة الجهاز",
  coins: "العملات",
  evaluation: "النقاط",
  rep: "الإعجابات",
  about: "عن الغرفة",
  max: "السعة القصوى",
  mic: "المايكات",
  needpass: "بكلمة سر",
  broadcast: "بث عام",
};

const LEGACY_CP_SECTIONS: Record<string, {
  title: string;
  description: string;
  tables: string[];
  actions?: string[];
}> = {
  actions: {
    title: "سجل الحالات",
    description: "متابعة تحركات الإدارة والتنبيهات اللحظية.",
    tables: ["stats", "histletter"],
  },
  bans: {
    title: "إدارة الحظر",
    description: "التحكم في قائمة المحظورين من الأسماء والأجهزة والدول.",
    tables: ["band", "bsb", "names"],
    actions: ["إضافة حظر جديد", "تطهير السجلات"],
  },
  roomBadges: {
    title: "أوسمة الغرف",
    description: "إدارة الشارات الخاصة بملاك ومشرفي الغرف.",
    tables: ["room_badges", "room_badge_assignments"],
  },
  siteBadges: {
    title: "أوسمة الموقع",
    description: "إدارة الأوسمة العامة التي تظهر في ملفات الأعضاء.",
    tables: ["site_badges"],
  },
  shrt: {
    title: "الاختصارات",
    description: "إدارة الكلمات المختصرة والردود الجاهزة.",
    tables: ["cuts"],
  },
  msgs: {
    title: "مركز الرسائل",
    description: "الرسائل الترحيبية والبريد الإداري الداخلي.",
    tables: ["intromsg", "internal_mail"],
  },
  giftsgit: {
    title: "متجر الهدايا",
    description: "إدارة أيقونات وأسعار الهدايا المتاحة للإرسال.",
    tables: ["gifts", "gift_categories"],
  },
  agentwallets: {
    title: "نظام الوكلاء",
    description: "إدارة حسابات الشحن والتحويلات المالية للوكلاء.",
    tables: ["agents", "coin_packages", "topup_orders"],
  },
};

const getAdminHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const AdminDashboard = ({ section }: AdminDashboardProps) => {
  const legacySection = LEGACY_CP_SECTIONS[section];
  
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 rtl bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto space-y-6">
        {section === "overview" && <OverviewSection />}
        {section === "users" && <UsersSection />}
        {section === "rooms" && <RoomsSection />}
        {section === "roles" && <RolesSection />}
        {section === "events" && <EventsSection />}
        {section === "settings" && <SettingsSection />}
        {section === "database" && <DatabaseSection />}
        {section === "bots" && <BotsAdminSection />}
        {section === "fltr" && <FiltersAdminSection />}
        {legacySection && <LegacyCpSection config={legacySection} />}
        
        {![ 
          "overview", "users", "rooms", "roles", "events", "settings", "database", "bots", "fltr",
          ...Object.keys(LEGACY_CP_SECTIONS)
        ].includes(section) && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-border">
            <SettingsIcon size={48} className="mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">هذا القسم قيد التطوير</h2>
            <p className="text-sm">سيتم ربط هذا القسم بالبيانات الحقيقية قريباً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LegacyCpSection = ({ config }: { config: typeof LEGACY_CP_SECTIONS[string] }) => {
  const [activeTable, setActiveTable] = useState(config.tables[0] || "");
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTable = async (table: string) => {
    setActiveTable(table);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/database?table=${table}&limit=50`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setColumns(data.columns || []);
        setRows(data.rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.tables[0]) loadTable(config.tables[0]);
  }, [config.title]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{config.title}</h2>
          <p className="text-sm font-medium text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {config.tables.map((table) => (
            <Button
              key={table}
              variant={activeTable === table ? "default" : "outline"}
              size="sm"
              onClick={() => loadTable(table)}
              className="rounded-full font-bold text-xs whitespace-nowrap"
            >
              {table}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.name} className="px-4 py-4 font-black whitespace-nowrap">
                      {FIELD_TRANSLATIONS[col.name] || col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length || 1} className="py-20 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/30" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length || 1} className="py-20 text-center text-muted-foreground font-bold">
                      لا توجد بيانات متوفرة حالياً
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      {columns.map((col) => (
                        <td key={col.name} className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {String(row[col.name] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DatabaseSection = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDatabase = async (table = "") => {
    setLoading(true);
    try {
      const url = table ? `/api/admin/database?table=${table}` : '/api/admin/database';
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        if (table) {
          setColumns(data.columns || []);
          setRows(data.rows || []);
          setSelectedTable(table);
        } else if (data.tables?.length > 0) {
          loadDatabase(data.tables[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDatabase(); }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <Card className="border-none shadow-lg rounded-3xl h-fit sticky top-6">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Database size={20} className="text-primary" />
            هيكل البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {tables.map((t) => (
            <button
              key={t.name}
              onClick={() => loadDatabase(t.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all mb-1 ${selectedTable === t.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              <span dir="ltr">{t.name}</span>
              <Badge variant="secondary" className="text-[10px] rounded-lg">{t.rowCount}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black" dir="ltr">{selectedTable}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadDatabase(selectedTable)} className="rounded-xl">تحديث</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.name} className="px-4 py-4 font-black whitespace-nowrap" dir="ltr">{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={columns.length || 1} className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      {columns.map((col) => (
                        <td key={col.name} className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {String(row[col.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- بقية الأقسام (Overview, Users, Rooms, etc) تبقى كما هي مع تحسينات طفيفة في التصميم ---

const OverviewSection = () => {
  const [stats, setStats] = useState({ users: 0, banned: 0, rooms: 0, reports: 0 });

  useEffect(() => {
    fetch('/api/admin/stats', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setStats(data.stats));
  }, []);

  const cards = [
    { label: 'إجمالي الأعضاء', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'المحظورين', value: stats.banned, icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'الغرف النشطة', value: stats.rooms, icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'سجل الإشراف', value: stats.reports, icon: BellRing, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c, i) => (
        <Card key={i} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${c.bg} dark:bg-slate-800 transition-colors`}>
              <c.icon className={c.color} size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{c.value.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const UsersSection = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchUsers = () => {
    fetch(`/api/admin/users?search=${search}`, { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setUsers(data.users));
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-black">إدارة الأعضاء</CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="بحث بالاسم أو المعرف..." 
              className="w-full md:w-72 h-11 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
            <Button onClick={fetchUsers} className="h-11 px-6 rounded-2xl font-bold">بحث</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black">العضو</th>
                <th className="px-6 py-4 font-black">الرتبة</th>
                <th className="px-6 py-4 font-black">الحالة</th>
                <th className="px-6 py-4 font-black">النقاط</th>
                <th className="px-6 py-4 font-black text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.idreg} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatarUrl || '/pic.png'} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                      <div>
                        <div className="font-black text-slate-800 dark:text-white">{u.displayName}</div>
                        <div className="text-[10px] font-bold text-slate-400" dir="ltr">#{u.idreg}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{u.role}</td>
                  <td className="px-6 py-4">
                    <Badge className={u.status === 'active' ? 'bg-green-500/10 text-green-600 border-none' : 'bg-red-500/10 text-red-600 border-none'}>
                      {u.status === 'active' ? 'نشط' : 'مكتوم'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-500">{u.evaluation}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-500 hover:bg-blue-50"><UserCog size={18} /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50"><Ban size={18} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// --- بقية المكونات (RoomsSection, RolesSection, etc) تتبع نفس النمط المطور ---
// تم اختصارها هنا للحفاظ على حجم الرد، ولكنها موجودة في الكود الفعلي

const RoomsSection = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/rooms', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setRooms(data.rooms));
  }, []);

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-black">إدارة الغرف</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black">الغرفة</th>
                <th className="px-6 py-4 font-black">المالك</th>
                <th className="px-6 py-4 font-black">السعة</th>
                <th className="px-6 py-4 font-black">المايكات</th>
                <th className="px-6 py-4 font-black text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={r.avatarUrl || '/room.png'} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                      <div>
                        <div className="font-black text-slate-800 dark:text-white">{r.name}</div>
                        <div className="text-[10px] font-bold text-slate-400" dir="ltr">/{r.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">{r.ownerName || 'الإدارة'}</td>
                  <td className="px-6 py-4 font-black text-slate-500">{r.maxMembers}</td>
                  <td className="px-6 py-4 font-black text-slate-500">{r.micSlots}</td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100"><SettingsIcon size={18} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const RolesSection = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/roles', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRoles(data.roles);
          setSelected(data.roles[0]);
        }
      });
  }, []);

  if (!selected) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <Card className="border-none shadow-lg rounded-3xl h-fit">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-black">الرتب</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all mb-1 ${selected.id === r.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              <span>{r.name}</span>
              <Badge variant="secondary" className="text-[10px] rounded-lg">{r.rank}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-primary">صلاحيات: {selected.name}</CardTitle>
              <p className="text-xs font-bold text-muted-foreground mt-1">تعديل قوى الرتبة في النظام</p>
            </div>
            <Button className="rounded-2xl font-bold px-8 shadow-lg shadow-primary/20">حفظ</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(selected.permissions || {}).map(([key, val]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{key}</span>
                {typeof val === 'boolean' ? (
                  <Switch checked={val} />
                ) : (
                  <Input className="w-20 h-8 text-center font-black" value={String(val)} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/events', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setEvents(data.events));
  }, []);

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-black">سجل الأحداث</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black">المشرف</th>
                <th className="px-6 py-4 font-black">الحدث</th>
                <th className="px-6 py-4 font-black">المستهدف</th>
                <th className="px-6 py-4 font-black">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{e.actorName}</td>
                  <td className="px-6 py-4"><Badge variant="outline" className="font-bold">{e.eventType}</Badge></td>
                  <td className="px-6 py-4 font-bold">{e.targetName}</td>
                  <td className="px-6 py-4 text-xs text-slate-400" dir="ltr">{new Date(e.createdAt).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const SettingsSection = () => {
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    fetch('/api/admin/settings', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setSettings(data.settings));
  }, []);

  if (!settings) return null;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardTitle className="text-xl font-black">إعدادات الموقع</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-500">اسم الشات</label>
          <Input value={settings.siteName} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-500">رسالة الترحيب</label>
          <Input value={settings.welcomeMessage} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-500">أقصى طول للرسالة</label>
            <Input type="number" value={settings.maxMessageLength} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-500">عضويات الـ IP</label>
            <Input type="number" value={settings.maxAccountsPerIp} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <span className="font-bold">وضع الصيانة</span>
          <Switch checked={settings.maintenanceMode} />
        </div>
        <Button className="w-full h-12 rounded-2xl font-black shadow-lg shadow-primary/20">حفظ الإعدادات</Button>
      </CardContent>
    </Card>
  );
};

const BotsAdminSection = () => {
  const [bots, setBots] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/bots', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setBots(data.bots));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bots.map(b => (
        <Card key={b.id} className="border-none shadow-lg rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <img src={b.avatarUrl || '/pic.png'} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100" alt="" />
              <div className="flex-1">
                <h3 className="font-black text-slate-800 dark:text-white">{b.name}</h3>
                <Badge className={b.isActive ? 'bg-green-500' : 'bg-slate-300'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-4 line-clamp-2">{b.description}</p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl font-bold">تعديل</Button>
              <Button variant="secondary" className="flex-1 rounded-xl font-bold">تشغيل</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const FiltersAdminSection = () => {
  const [filters, setFilters] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/filters', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setFilters(data.filters));
  }, []);

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black">فلتر الكلمات</CardTitle>
        <Button className="rounded-xl font-bold">+ إضافة كلمة</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
          {filters.map(f => (
            <div key={f.id} className="bg-white dark:bg-slate-900 p-4 flex items-center justify-between group">
              <div>
                <div className="font-black text-slate-800 dark:text-white">{f.pattern}</div>
                <div className="text-[10px] font-bold text-slate-400">{f.action} • {f.scope}</div>
              </div>
              <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Ban size={16} /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;