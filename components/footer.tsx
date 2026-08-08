import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-700 text-white">
            <span className="text-[10px] font-bold">T</span>
          </div>
          <span>© 2026 Trackr</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/about"
            className="hover:text-slate-700 dark:hover:text-slate-200"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="hover:text-slate-700 dark:hover:text-slate-200"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="hover:text-slate-700 dark:hover:text-slate-200"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
