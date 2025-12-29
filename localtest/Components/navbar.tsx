import Dropdown from "@/Components/Actions/Dropdown";
import { navigation } from "@/data/layout/navbar";
import Icon from "@/Components/Icon";

export default function Navbar() {
    const nav = navigation[0];

    return (
        <nav className="grid grid-cols-3 gap-5 px-32 py-5 shadow-xl">

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
            </div>

            {/* CENTER */}
            <div className="flex justify-center items-center gap-5">
                {nav.centerContent.map((item) => (
                    <a key={item.href}
                       href={item.href}>
                        <Icon name={item.icon} />
                        {item.label}
                    </a>
                ))}
            </div>

            {/* RIGHT */}
            <div className="flex justify-end items-center gap-5">
                {nav.rightContent.map((item) => (
                    <span key={item}>
                        {item}
                    </span>
                ))}
            </div>

        </nav>
    );
}
