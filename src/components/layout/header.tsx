'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User as UserIcon, GraduationCap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { AppSidebar } from './sidebar';
import { useSiteContent } from '@/context/site-content-provider';
import Image from 'next/image';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { content } = useSiteContent();
  const userInitials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col w-full p-0">
                        <SheetHeader className='p-6 pb-2'>
                          <SheetTitle>
                            <Link href="/" className="flex items-center gap-2 font-semibold">
                                {content.logoUrl ? (
                                  <div className="relative h-8 w-8">
                                    <Image src={content.logoUrl} alt={`${content.schoolName} Logo`} fill className="object-contain" />
                                  </div>
                                ) : (
                                  <GraduationCap className="h-8 w-8" />
                                )}
                                <span className="font-headline">{content.schoolName || 'Campus Hub'}</span>
                            </Link>
                          </SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto">
                          <AppSidebar isMobile={true}/>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <h1 className="text-lg font-semibold md:text-xl font-headline">
                {`Welcome, ${user?.displayName?.split(' ')[0] || 'User'}!`}
            </h1>
        </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
