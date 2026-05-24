
/** Top-level KPI card */
export const KPICard = ({ title, value, sub, icon: Icon, iconColor, subColor }: any) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-2 hover:shadow-md transition-shadow">
        <div className={`flex items-center gap-2 ${iconColor}`}>
            <Icon size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 leading-tight">{value}</p>
        <p className={`text-xs font-medium ${subColor ?? 'text-gray-400'}`}>{sub}</p>
    </div>
);