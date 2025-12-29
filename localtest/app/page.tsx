'use client';
import React from "react";

import { Icon } from "@iconify/react";
import Text from "@/Components/Text";
import Divider from "@/Components/Layout/Divider";
import Button from "@/Components/Actions/Button";
import Dropdown from "@/Components/Actions/Dropdown";
import Modal from "@/Components/Actions/Modal"
import Accordion from "@/Components/Display/Accordion";
import Card from "@/Components/Display/Card";
import Badge from "@/Components/Actions/Badge"
import Indicator from "@/Components/Layout/Indicator";
import Link from "@/Components/Navigation/Link"

export default function Home() {
    return (
        <>
            <Text type="h1" iconLeft="lucide:alarm-smoke">Je suis la page d’accueil</Text>

            <link rel="icon" href="lucide:armchair" alt-="Coucou"/>
            <Icon icon="lucide:armchair"/>
            <Divider/>
            <Button>Coucou</Button>
            <Dropdown hover>
                <p>Coucou</p>
                <p>Coucou</p><p>Coucou</p><p>Coucou</p><p>Coucou</p><p>Coucou</p><p>Coucou</p>
                <a href="#">Coucou</a>
            </Dropdown>
            <Modal>
                <div>Content</div>
            </Modal>

            <Accordion
                items={[
                    { title: 'Section 1', content: 'Contenu de la section 1' },
                    { title: 'Section 2', content: 'Contenu de la section 2' },
                    { title: 'Section 3', content: 'Contenu de la section 3' },
                ]}
            />

            <div className="grid grid-cols-4 gap-4">
                <Card
                    title="iPhone 15 Pro"
                    description="Le smartphone le plus avancé avec puce A17 Pro, appareil photo 48MP et design en titane."
                    imageSrc="https://picsum.photos/1920/1080"
                    imageAlt="iPhone 15 Pro"
                    buttonText="Ajouter au panier"
                    // onButtonClick={() => addToCart()}
                />
                <Badge color="success">Validé</Badge>
                <Indicator/>
            </div>

            <Link to="/asdasd" iconLeft="lucide:atom">Text</Link>
        </>
    )
}