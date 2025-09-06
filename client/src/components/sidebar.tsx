import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dumbbell, ChartPie, Users, QrCode, CreditCard, 
  UserPlus, MessageCircle, FileText, Menu, X 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {}

export default function Sidebar({}: SidebarProps = {}) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: ChartPie },
    { name: "Members", href: "/members", icon: Users },
    { name: "Attendance", href: "/attendance", icon: QrCode },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "QR Registration", href: "/qr-registration", icon: UserPlus },
    { name: "Communication", href: "/communication", icon: MessageCircle },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-sidebar-toggle"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-card shadow-lg border-r border-border transition-transform duration-300 ease-in-out",
        "fixed md:relative h-screen z-40",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">FitManage Pro</h1>
              <p className="text-sm text-muted-foreground">Gym Management System</p>
            </div>
          </div>
        </div>


        <nav className="mt-4">
          <ul className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                      data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
