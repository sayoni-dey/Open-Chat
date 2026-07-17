// /* BOTTOM LEFT: USER IDENTIFIER FOOTER */
// import { useEffect, useState } from "react";
// import { UserButton, useUser } from "@clerk/nextjs";
// import { Sun, Moon, Laptop, User } from "lucide-react";

// export function UserIdentifierFooter() {
//   const { user, isLoaded } = useUser();
//   // State can now be "light", "dark", or "system"
//   const [theme, setTheme] = useState("system");

//   // Applies the theme to the <html> tag
//   const applyTheme = (currentTheme: string) => {
//     const root = window.document.documentElement;
//     root.classList.remove("light", "dark");

//     if (currentTheme === "system") {
//       const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
//         ? "dark"
//         : "light";
//       root.classList.add(systemTheme);
//     } else {
//       root.classList.add(currentTheme);
//     }
//   };

//   // Sync theme status smoothly on mount and watch system changes
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("theme") || "system";
//     setTheme(savedTheme);
//     applyTheme(savedTheme);

//     // If it's system mode, listen to real-time OS theme modifications changes
//     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//     const handleSystemThemeChange = () => {
//       if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
//         applyTheme("system");
//       }
//     };

//     mediaQuery.addEventListener("change", handleSystemThemeChange);
//     return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
//   }, []);

//   // Cycle through modes: system -> light -> dark -> system
//   const handleThemeCycle = () => {
//     let nextTheme = "system";
//     if (theme === "system") nextTheme = "light";
//     else if (theme === "light") nextTheme = "dark";
//     else if (theme === "dark") nextTheme = "system";

//     setTheme(nextTheme);
//     localStorage.setItem("theme", nextTheme);
//     applyTheme(nextTheme);
//   };

//   // Extract custom username from email by splitting at "@"
//   const getFallbackUsername = () => {
//     if (!user) return "";
//     const email = user.emailAddresses[0]?.emailAddress;
//     return email ? email.split("@")[0] : "user";
//   };

//   return (
//     <div className="sticky bottom-0 left-0 w-full border-t border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#171717] p-4 transition-colors duration-200">
//       <div className="flex items-center justify-between gap-3">
        
//         {/* User Profile Action Center */}
//         <div className="flex items-center gap-3 overflow-hidden">
//           {isLoaded && user ? (
//             <>
//               {/* Signed-In State */}
//               <UserButton 
//                 userProfileMode="navigation"
//                 userProfileUrl="/user-profile"
//                 appearance={{
//                   elements: {
//                     avatarBox: "w-9 h-9 border border-gray-300 dark:border-[#3c3c3c]"
//                   }
//                 }}
//               />
//               <div className="flex flex-col text-left overflow-hidden">
//                 <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
//                   {user.fullName || user.firstName || getFallbackUsername()}
//                 </span>
//                 <span className="truncate text-xs text-gray-500 dark:text-gray-400">
//                   @{user.username || getFallbackUsername()}
//                 </span>
//               </div>
//             </>
//           ) : (
//             <>
//               {/* Anonymous / Loading State */}
//               <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-[#3c3c3c] bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400">
//                 <User size={18} />
//               </div>
//               <div className="flex flex-col text-left overflow-hidden">
//                 <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
//                   User
//                 </span>
//                 <span className="truncate text-xs text-gray-500 dark:text-gray-400">
//                   Anonymous Guest
//                 </span>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Ambient Multi-Theme Selector Toggle */}
//         <button
//           type="button"
//           onClick={handleThemeCycle}
//           className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-white transition-colors flex items-center gap-1"
//           title={`Current: ${theme} mode. Click to cycle themes.`}
//         >
//           {theme === "system" && (
//             <Laptop size={18} className="text-blue-500" />
//           )}
//           {theme === "light" && (
//             <Sun size={18} className="text-amber-500" />
//           )}
//           {theme === "dark" && (
//             <Moon size={18} className="text-indigo-400" />
//           )}
//           <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
//             {theme}
//           </span>
//         </button>

//       </div>
//     </div>
//   );
// }

/* BOTTOM LEFT: USER IDENTIFIER FOOTER */
import { useEffect, useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Sun, Moon, Laptop, User, LogOut, Settings, MoreVertical } from "lucide-react";

export function UserIdentifierFooter() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  
  // Theme management states
  const [theme, setTheme] = useState("system");
  // Toggle state for the bottom-left profile popup menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the popup if clicked outside the boundary
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Applies the theme to the <html> tag
  const applyTheme = (currentTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
  };

  // Sync theme status smoothly on mount and watch system changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // Cycle through modes: system -> light -> dark -> system
  const handleThemeCycle = () => {
    let nextTheme = "system";
    if (theme === "system") nextTheme = "light";
    else if (theme === "light") nextTheme = "dark";
    else if (theme === "dark") nextTheme = "system";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  // Extract custom username from email by splitting at "@"
  const getFallbackUsername = () => {
    if (!user) return "";
    const email = user.emailAddresses[0]?.emailAddress;
    return email ? email.split("@")[0] : "user";
  };

  return (
    <div 
      ref={menuRef}
      className="sticky bottom-0 left-0 w-full border-t border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#171717] p-4 transition-colors duration-200 z-50"
    >
      {/* 1. INTERACTIVE POP-UP USER OPTIONS MENU */}
      {isMenuOpen && isLoaded && user && (
        <div className="absolute bottom-full left-4 mb-2 w-64 rounded-xl border border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#232323] p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2f2f2f] mb-1">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Account Settings</p>
          </div>
          
          {/* Native Clerk User Profile Dashboard Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              openUserProfile(); // Opens built-in profile, username, picture & account deletion configuration modal
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors text-left"
          >
            <Settings size={16} className="text-gray-500 dark:text-gray-400" />
            <div className="flex flex-col">
              <span>Manage Profile</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Username, Photo, Security</span>
            </div>
          </button>

          {/* Native Clerk Sign Out Operation */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* FOOTER CORE BRANDING ROW */}
      <div className="flex items-center justify-between gap-2">
        
        {/* User Profile Action Center Trigger */}
        <button
          type="button"
          disabled={!user}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-3 overflow-hidden flex-1 text-left p-1 rounded-xl transition-all ${
            user ? "hover:bg-gray-100 dark:hover:bg-[#262626] active:scale-[0.98]" : "cursor-default"
          }`}
        >
          {isLoaded && user ? (
            <>
              {/* Signed-In Avatar Canvas */}
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-gray-300 light:border-[#3c3c3c]"
              />
              <div className="flex flex-col text-left overflow-hidden flex-1">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {user.fullName || user.firstName || getFallbackUsername()}
                </span>
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                  @{user.username || getFallbackUsername()}
                </span>
              </div>
              <MoreVertical size={16} className="text-gray-400 dark:text-gray-500 mr-1 flex-shrink-0" />
            </>
          ) : (
            <>
              {/* Anonymous / Loading Placeholder State */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-[#3c3c3c] bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400">
                <User size={18} />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  User
                </span>
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Anonymous Guest
                </span>
              </div>
            </>
          )}
        </button>

        {/* Ambient Multi-Theme Selector Toggle */}
        <button
          type="button"
          onClick={handleThemeCycle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
          title={`Current: ${theme} mode. Click to cycle themes.`}
        >
          {theme === "system" && <Laptop size={17} className="text-blue-500" />}
          {theme === "light" && <Sun size={17} className="text-amber-500" />}
          {theme === "dark" && <Moon size={17} className="text-indigo-400" />}
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 hidden sm:inline">
            {theme}
          </span>
        </button>

      </div>
    </div>
  );
}