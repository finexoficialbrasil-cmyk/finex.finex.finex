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
import Bills from './pages/Bills';
import Categories from './pages/Categories';
import Consultor from './pages/Consultor';
import DownloadApp from './pages/DownloadApp';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Import from './pages/Import';
import Payables from './pages/Payables';
import Profile from './pages/Profile';
import Receivables from './pages/Receivables';
import Reports from './pages/Reports';
import Statement from './pages/Statement';
import TermsOfService from './pages/TermsOfService';
import Transactions from './pages/Transactions';
import Tutorials from './pages/Tutorials';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accounts": Accounts,
    "Admin": Admin,
    "Bills": Bills,
    "Categories": Categories,
    "Consultor": Consultor,
    "DownloadApp": DownloadApp,
    "Goals": Goals,
    "Home": Home,
    "Import": Import,
    "Payables": Payables,
    "Profile": Profile,
    "Receivables": Receivables,
    "Reports": Reports,
    "Statement": Statement,
    "TermsOfService": TermsOfService,
    "Transactions": Transactions,
    "Tutorials": Tutorials,
    "Dashboard": Dashboard,
    "Plans": Plans,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};