import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NavLink = ({ href, children, currentPath }: { href: string; children: React.ReactNode; currentPath: string }) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href} className={`${
      isActive 
        ? "border-primary text-gray-900" 
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
      {children}
    </Link>
  );
};

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.username?.substring(0, 2) || "U";

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-primary font-bold text-xl">
                Photosphere
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/" currentPath={location}>Dashboard</NavLink>
              <NavLink href="/galleries" currentPath={location}>Galleries</NavLink>
              <NavLink href="/organizations" currentPath={location}>Organizations</NavLink>
              <NavLink href="/competitions" currentPath={location}>Competitions</NavLink>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2" aria-label="Notifications">
                  <Bell className="h-5 w-5 text-gray-400" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full" aria-label="User menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username || "User"} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href="/profile" className="cursor-pointer w-full">
                        Your Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/settings" className="cursor-pointer w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="cursor-pointer w-full">Sign out</a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col space-y-4 py-4">
                  <Link 
                    href="/" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/galleries" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Galleries
                  </Link>
                  <Link 
                    href="/organizations" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Organizations
                  </Link>
                  <Link 
                    href="/competitions" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Competitions
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <Link 
                          href="/profile" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                          Your Profile
                        </Link>
                        <Link 
                          href="/settings" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                          Settings
                        </Link>
                        <a 
                          href="/api/logout" 
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                          Sign out
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="border-t border-gray-200 pt-4">
                      <a 
                        href="/api/login" 
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        Sign In
                      </a>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
