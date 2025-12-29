import React from "react";
import Icon from "@/Components/Icon";

interface SearchbarProps {
    placeholder?: string;
    iconLeft?: string;
    iconRight?: string;
}

const Searchbar: React.FC<SearchbarProps> = ({
                                                 placeholder = "Search...",
                                                 iconLeft,
                                                 iconRight,
                                             }) => {
    return (
        <div className="relative flex items-center w-fit">
            {iconLeft && (
                <span className="absolute left-3 text-gray-400">
          <Icon name={iconLeft} />
        </span>
            )}

            <input
                type="text"
                placeholder={placeholder}
                className={`p-2 rounded-full border border-gray-200 outline-none
          ${iconLeft ? "pl-10" : ""}
          ${iconRight ? "pr-10" : ""}
        `}
            />

            {iconRight && (
                <span className="absolute right-3 text-gray-400">
          <Icon name={iconRight} />
        </span>
            )}
        </div>
    );
};

export default Searchbar;
