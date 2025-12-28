
export default function Navbar() {
    return (
        <nav className="grid grid-cols-3 gap-5 px-32 py-5 shadow-xl">
            <img
                src="/logo.png"
                alt="Logo"
            />

            <div className="flex justify-center space-x-5">
                <div>
                    <div className="dropdown dropdown-center">
                        <div tabIndex="0" role="button" className="">Vitrines</div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                            <li><a>Item 1</a></li>
                            <li><a>Item 2</a></li>
                        </ul>
                    </div>
                </div>

                <div>
                    <div className="dropdown dropdown-center">
                        <div tabIndex="0" role="button" className="">Meules</div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                            <li><a>Item 1</a></li>
                            <li><a>Item 2</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <p>Panier user etc...</p>
            </div>
        </nav>
    );
}
