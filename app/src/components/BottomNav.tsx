import { Home, Search, Heart, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { icon: Home, label: 'Home', path: '/landing' },
        { icon: Search, label: 'Search', path: '/search' },
        { icon: Heart, label: 'Saved', path: '/saved' },
        { icon: User, label: 'Profile', path: '/dashboard' },
    ];

    return (
        <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
            <div className="bg-gradient-to-r from-[#075985] via-[#0284C7] to-[#075985] backdrop-blur-md rounded-full shadow-2xl shadow-[#0284C7]/40 border border-white/15 p-2 flex justify-between items-center px-6">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${isActive(item.path) ? 'text-[#F5A623] drop-shadow-[0_0_6px_rgba(245,166,35,0.6)]' : 'text-white/70 hover:text-white'
                            }`}
                    >
                        <item.icon
                            className={`w-6 h-6 ${isActive(item.path) ? 'fill-current' : ''}`}
                            strokeWidth={isActive(item.path) ? 0 : 2.5}
                        />
                        {/* <span className="text-[10px] font-bold">{item.label}</span> */}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
