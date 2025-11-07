import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Bills from './pages/Bills';
import Statement from './pages/Statement';
import Categories from './pages/Categories';
import Payables from './pages/Payables';
import Goals from './pages/Goals';
import Receivables from './pages/Receivables';
import Tutorials from './pages/Tutorials';
import Admin from './pages/Admin';
import Consultor from './pages/Consultor';
import Plans from './pages/Plans';
import DownloadApp from './pages/DownloadApp';
import Import from './pages/Import';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "Accounts": Accounts,
    "Reports": Reports,
    "Profile": Profile,
    "Bills": Bills,
    "Statement": Statement,
    "Categories": Categories,
    "Payables": Payables,
    "Goals": Goals,
    "Receivables": Receivables,
    "Tutorials": Tutorials,
    "Admin": Admin,
    "Consultor": Consultor,
    "Plans": Plans,
    "DownloadApp": DownloadApp,
    "Import": Import,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};