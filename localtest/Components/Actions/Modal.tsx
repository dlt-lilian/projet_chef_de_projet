'use client';

import React, { useRef } from 'react';
import Button from "@/Components/Actions/Button";

type ModalVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost';
type ModalSize = 'xs' | 'sm' | 'md' | 'lg';
type ModalWidth = 'full' | 'col' | 'max';
type ModalPosition = 'top' | 'middle' | 'bottom';

interface ModalProps {
    variant?: ModalVariant;
    size?: ModalSize;
    iconLeft?: string | null;
    iconRight?: string | null;
    width?: ModalWidth;
    outline?: boolean;
    wide?: boolean;
    disabled?: boolean;
    position?: ModalPosition;
    trigger?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
                                         variant = 'primary',
                                         size = 'md',
                                         iconLeft = null,
                                         iconRight = null,
                                         width = 'max',
                                         outline = false,
                                         wide = false,
                                         disabled = false,
                                         position = 'middle',
                                         trigger,
                                         children,
                                         className = '',
                                     }) => {
    const modalRef = useRef<HTMLDialogElement>(null);

    const positionClasses: Record<ModalPosition, string> = {
        top: 'modal-top',
        middle: 'modal-middle',
        bottom: 'modal-bottom',
    };

    const modalClasses = [
        'modal',
        positionClasses[position],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const openModal = () => {
        modalRef.current?.showModal();
    };

    const closeModal = () => {
        modalRef.current?.close();
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                iconLeft={iconLeft}
                iconRight={iconRight}
                width={width}
                outline={outline}
                wide={wide}
                disabled={disabled}
                onClick={openModal}
            >
                {trigger || 'Open Modal'}
            </Button>

            <dialog ref={modalRef} className={modalClasses}>
                <div className="modal-box">
                    <form method="dialog" className="flex justify-end">
                        <Button variant="ghost" size="xs" className="w-max" onClick={closeModal}>
                            ✕
                        </Button>
                    </form>
                    {children}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button type="button" onClick={closeModal}>close</button>
                </form>
            </dialog>
        </>
    );
};

export default Modal;