/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Accounts from './pages/Accounts';
import Admin from './pages/Admin';
import Categories from './pages/Categories';
import Consultor from './pages/Consultor';
import DownloadApp from './pages/DownloadApp';
import Home from './pages/Home';
import Import from './pages/Import';
import Payables from './pages/Payables';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Receivables from './pages/Receivables';
import Reports from './pages/Reports';
import Statement from './pages/Statement';
import TermsOfService from './pages/TermsOfService';
import Tutorials from './pages/Tutorials';
import Goals from './pages/Goals';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Bills from './pages/Bills';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accounts": Accounts,
    "Admin": Admin,
    "Categories": Categories,
    "Consultor": Consultor,
    "DownloadApp": DownloadApp,
    "Home": Home,
    "Import": Import,
    "Payables": Payables,
    "Plans": Plans,
    "Profile": Profile,
    "Receivables": Receivables,
    "Reports": Reports,
    "Statement": Statement,
    "TermsOfService": TermsOfService,
    "Tutorials": Tutorials,
    "Goals": Goals,
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "Bills": Bills,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};