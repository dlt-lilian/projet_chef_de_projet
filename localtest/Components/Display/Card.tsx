'use client';

import React, { useRef } from 'react';
import Button from '@/Components/Actions/Button';
import Text from '@/Components/Text';
import Indicator from "@/Components/Layout/Indicator";

interface CardProps {
    title?: string;
    description?: string;
    imageSrc?: string;
    imageAlt?: string;
    buttonText?: string;
    onButtonClick?: () => void;
    className?: string;
    children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
                                       title = 'Title',
                                       description = 'Description',
                                       imageSrc = 'https://picsum.photos/1920/1080',
                                       imageAlt = 'image',
                                       buttonText = 'Action',
                                       onButtonClick,
                                       className = '',
                                       children,
                                   }) => {
    const modalRef = useRef<HTMLDialogElement>(null);

    const openModal = () => {
        modalRef.current?.showModal();
    };

    const closeModal = () => {
        modalRef.current?.close();
    };

    return (
        <>
            <div className={`border border-gray-100 p-5 rounded-4xl ${className}`}>
                <figure className="cursor-pointer"
                        onClick={openModal}>
                    <img
                        className="aspect-square object-cover w-full rounded-4xl shadow-xl transform transition-transform duration-300 ease-in-out hover:scale-101"
                        src={imageSrc}
                        alt={imageAlt}
                    />
                </figure>
                <div className="card-body">
                    <Text type="h2"
                          className="card-title">
                        {title}
                    </Text>
                    <Text type="p">
                        {description}
                    </Text>
                    <Button onClick={onButtonClick}>
                        {buttonText}
                    </Button>
                </div>
            </div>

            <dialog ref={modalRef}
                    className="modal modal-middle">
                <div className="modal-box max-w-6xl p-0 overflow-hidden">
                    <form method="dialog"
                          className="absolute top-4 right-4 z-10">
                        <Button iconRight="lucide:x"
                                variant="ghost"
                                className="w-max bg-white/80 hover:bg-white"
                                onClick={closeModal}/>
                    </form>

                    <div className="grid md:grid-cols-2 gap-0">
                        {/*Image*/}
                        <div className="bg-gray-50 p-8 flex items-center justify-center">
                            <img
                                src={imageSrc}
                                alt={imageAlt}
                                className="aspect-square object-cover w-full rounded-4xl shadow-xl"
                            />
                        </div>

                        {/* Product Details Section */}
                        <div className="p-8 flex flex-col">
                            <div className="flex-1">
                                <Text type="h2" size="xl">
                                    {title}
                                </Text>
                                <Text type="p">
                                    {description}
                                </Text>

                                {/* Price */}
                                <div className="mb-6 space-x-5">
                                    <Text type="span"
                                          size="lg"
                                          weight="bold"
                                          color="lightgreen">
                                        99.99€
                                    </Text>
                                    <Text type="span"
                                          size="lg"
                                          through>
                                        129.99€
                                    </Text>
                                </div>

                                {/* Stock Status */}
                                <div className="flex items-center gap-2 mb-6">
                                    <Indicator/>
                                    <Text type="span"
                                          color="green">
                                        En stock - Livraison rapide
                                    </Text>
                                </div>

                                {/* Specifications */}
                                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <Text type="span">
                                            Catégorie:
                                        </Text>
                                        <Text type="span">
                                            Électronique
                                        </Text>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <Text type="span">
                                            Marque:
                                        </Text>
                                        <Text type="span">
                                            Premium Brand
                                        </Text>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <Text type="span">
                                            Référence:
                                        </Text>
                                        <Text type="span">
                                            #PRD-12345
                                        </Text>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="mb-6">
                                    {/*Ajouter au composant Text*/}
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Quantité
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Button iconRight="lucide:minus"/>
                                        {/*Mettre vrai quantité*/}
                                        <Text type="span">
                                            1
                                        </Text>
                                        <Button iconRight="lucide:plus"/>
                                    </div>
                                </div>

                                {/* Custom Content */}
                                {children && <div className="mb-6">{children}</div>}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-6 border-t border-gray-200">
                                <Button
                                    variant="primary"
                                    width="full"
                                    onClick={onButtonClick}
                                >
                                    Ajouter au panier
                                </Button>
                                <Button
                                    variant="secondary"
                                    width="full"
                                    outline
                                >
                                    Acheter maintenant
                                </Button>
                            </div>

                            {/* Additional Info */}
                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <Text type="span"
                      className="flex items-center gap-1">
                  🚚 Livraison gratuite dès 50€
                </Text>

                <Text type="span"
                      className="flex items-center gap-1">
                  ↩️ Retours sous 30 jours
                </Text>
                            </div>
                        </div>
                    </div>
                </div>
                <form method="dialog"
                      className="modal-backdrop">
                    <Button onClick={closeModal}>
                        close
                    </Button>
                </form>
            </dialog>
        </>
    );
};

export default Card;