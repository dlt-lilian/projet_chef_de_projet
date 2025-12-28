import { Icon } from "@iconify/react";
import Text from "@/Components/Text";
import Divider from "@/Components/Layout/Divider";

export default function Home() {
    return (
        <>
            <Text type="h1" iconLeft="lucide:alarm-smoke">Je suis la page d’accueil</Text>

            <link rel="icon" href="lucide:armchair" alt-="Coucou"/>
            <Icon icon="lucide:armchair"/>
            <Divider/>
        </>
    )
}