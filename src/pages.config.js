import Accounts from './pages/Accounts';
import Admin from './pages/Admin';
import Bills from './pages/Bills';
import Categories from './pages/Categories';
import Consultor from './pages/Consultor';
import Dashboard from './pages/Dashboard';
import DownloadApp from './pages/DownloadApp';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Import from './pages/Import';
import Payables from './pages/Payables';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Receivables from './pages/Receivables';
import Reports from './pages/Reports';
import Statement from './pages/Statement';
import TermsOfService from './pages/TermsOfService';
import Transactions from './pages/Transactions';
import Tutorials from './pages/Tutorials';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accounts": Accounts,
    "Admin": Admin,
    "Bills": Bills,
    "Categories": Categories,
    "Consultor": Consultor,
    "Dashboard": Dashboard,
    "DownloadApp": DownloadApp,
    "Goals": Goals,
    "Home": Home,
    "Import": Import,
    "Payables": Payables,
    "Plans": Plans,
    "Profile": Profile,
    "Receivables": Receivables,
    "Reports": Reports,
    "Statement": Statement,
    "TermsOfService": TermsOfService,
    "Transactions": Transactions,
    "Tutorials": Tutorials,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};