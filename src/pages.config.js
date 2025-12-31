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
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Statement from './pages/Statement';
import TermsOfService from './pages/TermsOfService';
import Transactions from './pages/Transactions';
import Tutorials from './pages/Tutorials';
import Receivables from './pages/Receivables';
import Payables from './pages/Payables';
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
    "Plans": Plans,
    "Profile": Profile,
    "Reports": Reports,
    "Statement": Statement,
    "TermsOfService": TermsOfService,
    "Transactions": Transactions,
    "Tutorials": Tutorials,
    "Receivables": Receivables,
    "Payables": Payables,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};