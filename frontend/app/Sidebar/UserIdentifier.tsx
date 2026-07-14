// /* BOTTOM LEFT: USER IDENTIFIER FOOTER */
// import { useEffect, useState } from "react";
// import { UserButton, useUser } from "@clerk/nextjs";
// import { Sun, Moon } from "lucide-react";

// export function UserIdentifierFooter() {
//   const { user } = useUser();
//   const [theme, setTheme] = useState("dark");

//   // Sync theme status smoothly with document classes on client mount
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("theme") || "dark";
//     setTheme(savedTheme);
//     if (savedTheme === "dark") {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//   }, []);

//   const toggleTheme = () => {
//     const nextTheme = theme === "dark" ? "light" : "dark";
//     setTheme(nextTheme);
//     localStorage.setItem("theme", nextTheme);
//     if (nextTheme === "dark") {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//   };

//   return (
//     <div className="sticky bottom-0 left-0 w-full border-t border-[#3c3c3c] bg-[#171717] p-4 dark:bg-[#171717] transition-colors duration-200">
//       <div className="flex items-center justify-between gap-3">
//         {/* User Profile Action Center */}
//         <div className="flex items-center gap-3 overflow-hidden">
//           <UserButton 
//             userProfileMode="navigation"
//             userProfileUrl="/user-profile" // Defaults to opening built-in popups natively
//             appearance={{
//               elements: {
//                 avatarBox: "w-9 h-9 border border-[#3c3c3c]"
//               }
//             }}
//           />
//           {user && (
//             <div className="flex flex-col text-left overflow-hidden">
//               <span className="truncate text-sm font-medium text-white">
//                 {user.fullName || user.firstName || "Chat User"}
//               </span>
//               <span className="truncate text-xs text-gray-400">
//                 @{user.username || user.emailAddresses[0]?.emailAddress.split("@")[0]}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Ambient Dark/Light Theme Switching Hook */}
//         <button
//           type="button"
//           onClick={toggleTheme}
//           className="rounded-lg p-2 text-gray-400 hover:bg-[#2f2f2f] hover:text-white transition-colors"
//           title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
//         >
//           {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
//         </button>
//       </div>
//     </div>
//   );
// }

// /* BOTTOM LEFT: USER IDENTIFIER FOOTER */
// import { useEffect, useState } from "react";
// import { UserButton, useUser } from "@clerk/nextjs";
// import { Sun, Moon, User } from "lucide-react";

// export function UserIdentifierFooter() {
//   const { user, isLoaded } = useUser();
//   const [theme, setTheme] = useState("dark");

//   // Sync theme status smoothly with document classes on client mount
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("theme") || "dark";
//     setTheme(savedTheme);
//     if (savedTheme === "dark") {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//   }, []);

//   const toggleTheme = () => {
//     const nextTheme = theme === "dark" ? "light" : "dark";
//     setTheme(nextTheme);
//     localStorage.setItem("theme", nextTheme);
//     if (nextTheme === "dark") {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
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

//         {/* Ambient Dark/Light Theme Toggle */}
//         <button
//           type="button"
//           onClick={toggleTheme}
//           className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-white transition-colors"
//           title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
//         >
//           {theme === "dark" ? (
//             <Sun size={18} className="text-amber-500" />
//           ) : (
//             <Moon size={18} className="text-slate-700" />
//           )}
//         </button>

//       </div>
//     </div>
//   );
// }


/* BOTTOM LEFT: USER IDENTIFIER FOOTER */
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Sun, Moon, Laptop, User } from "lucide-react";

export function UserIdentifierFooter() {
  const { user, isLoaded } = useUser();
  // State can now be "light", "dark", or "system"
  const [theme, setTheme] = useState("system");

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

    // If it's system mode, listen to real-time OS theme modifications changes
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
    <div className="sticky bottom-0 left-0 w-full border-t border-gray-200 dark:border-[#3c3c3c] bg-white dark:bg-[#171717] p-4 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        
        {/* User Profile Action Center */}
        <div className="flex items-center gap-3 overflow-hidden">
          {isLoaded && user ? (
            <>
              {/* Signed-In State */}
              <UserButton 
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-gray-300 dark:border-[#3c3c3c]"
                  }
                }}
              />
              <div className="flex flex-col text-left overflow-hidden">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {user.fullName || user.firstName || getFallbackUsername()}
                </span>
                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                  @{user.username || getFallbackUsername()}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Anonymous / Loading State */}
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
        </div>

        {/* Ambient Multi-Theme Selector Toggle */}
        <button
          type="button"
          onClick={handleThemeCycle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-white transition-colors flex items-center gap-1"
          title={`Current: ${theme} mode. Click to cycle themes.`}
        >
          {theme === "system" && (
            <Laptop size={18} className="text-blue-500" />
          )}
          {theme === "light" && (
            <Sun size={18} className="text-amber-500" />
          )}
          {theme === "dark" && (
            <Moon size={18} className="text-indigo-400" />
          )}
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
            {theme}
          </span>
        </button>

      </div>
    </div>
  );
}