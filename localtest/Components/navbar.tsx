import Dropdown from "@/Components/Actions/Dropdown"

export default function Navbar() {
    return (
        <nav className="grid grid-cols-3 gap-5 px-32 py-5 shadow-xl">
            <div className="flex items-center gap-5">
                <img
                    src="/logo.png"
                    alt="Logo"
                />
                <Dropdown>
                    <Dropdown variant="ghost" position="right">
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                    </Dropdown>
                    <Dropdown variant="ghost" position="right">
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                    </Dropdown>
                    <Dropdown variant="ghost" position="right">
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                        <a href="#">Coucou</a>
                    </Dropdown>
                </Dropdown>

                <div className="dropdown dropdown-center">
                    <div tabIndex="0"
                         role="button"
                         className="">Parcourir les catégories</div>
                    <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                        <li><a>Item 1</a></li>
                        <li><a>Item 2</a></li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-center items-center gap-5">
                <p>Coucou</p>
            </div>

            <div className="flex justify-end items-center gap-5">
                <p>Panier user etc...</p>
            </div>
        </nav>
    );
}
