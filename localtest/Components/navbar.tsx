import Dropdown from "@/Components/Actions/Dropdown";
import { navigation } from "@/data/layout/navbar";
import Icon from "@/Components/Icon";
import Link from "@/Components/Navigation/Link";
import Searchbar from "@/Components/Input/Searchbar";

export default function Navbar() {
    const nav = navigation[0];

    return (
        <nav className="flex justify-between gap-5 px-32 py-5 shadow-xl">

            {/* LEFT */}
            <div className="flex items-center gap-5">
                <a href={nav.home}>
                <img src={nav.logo}
                     alt="Logo" />
                </a>

                <a href={nav.leftContent.link}>
                <Dropdown variant="ghost"
                          hover
                          position="right"
                          title={nav.leftContent.title}>
                    {nav.leftContent.content.map((item) => (
                        <a key={item.href}
                           href={item.href}
                           className="block px-2 py-1">
                            {item.label}
                        </a>
                    ))}
                </Dropdown>
                </a>
                {nav.leftContent.pages.map((item) => (
                <Link key={item.href}
                      to={item.href}
                      iconLeft={item.icon}>
                    {item.label}
                </Link>
                ))}
            </div>

            {/* RIGHT */}
            <div className="flex justify-end  w-max items-center gap-5">
                <Searchbar iconRight={nav.searchIcon}/>
                <div className="flex justify-end items-center gap-5 w-full">
                    {nav.rightContent.map((item) => (
                        <Link key={item.href}
                              to={item.href}
                              iconLeft={item.icon}>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

        </nav>
    );
}
