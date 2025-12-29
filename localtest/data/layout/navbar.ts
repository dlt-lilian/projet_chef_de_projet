export const navigation = [
    {
        logo: "/logo.png",
        home: "/",
        leftContent: {
            title: "Parcourir les catégories",
            link: "/productgrid",
            content: [
                { label: "Objets en vitrine", href: "/objets-en-vitrine" },
                { label: "Art de table", href: "/art-de-table" },
                { label: "Bijou", href: "/bijou" },
                { label: "Musique", href: "/musique" },
                { label: "Mode", href: "/mode" },
                { label: "Mobilier", href: "/mobilier" },
                { label: "Chambre", href: "/chambre" },
                { label: "Meubles de rangements", href: "/meubles-de-rangements" },
                { label: "Tables", href: "/tables" }
            ]
        },
        centerContent: [
            { label: "Le magasin", icon: "lucide:atom", href: "/le-magasin" },
            { label: "Le dépôt", icon: "lucide:atom", href: "/le-depot" },
        ],
        rightContent: ["Coucou"]
    }
];
