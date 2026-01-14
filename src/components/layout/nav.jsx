import React from 'react'
import Button from '../common/button'
import { useAuth } from '../../hooks/useAuth'
import { User, Bell, PlusIcon } from 'lucide-react'

export default function Nav({ isOpen }) {
    const { userData } = useAuth()

    return (
        <nav className='p-2 w-full overflow-hidden'>
            <div className={`flex items-center justify-between gap-2 ${isOpen ? 'pl-52' : 'pl-20'} transition-all duration-300`}>
                {userData && (
                    <p className='text-base text'>Bienvenido, {userData.nombre} {userData.apellido}</p>
                )}
                <div className='flex items-center justify-end w-1/3 gap-2'>
                    <div className='p-2 rounded-full bg-purple-600 text-white'>
                        <User className='w-6 h-6' />
                    </div>
                    <div className='p-2 rounded-full bg-purple-600 text-white'>
                        <Bell className='w-6 h-6' />
                    </div>
                {userData && userData.roles && (
                    userData.roles.nombre_rol === "Administrador" ? (
                        <div className='flex items-center whitespace-nowrap gap-1 bg-purple-600 text-white px-2 py-2.5 rounded-full'>
                            <PlusIcon className='w-6 h-6' />
                            Agregar Documento
                        </div>
                    ) : (
                        <div className='flex items-center whitespace-nowrap gap-1 bg-purple-600 text-white px-2 py-2.5 rounded-full'>
                            <PlusIcon className='w-6 h-6' />
                            Agregar HH
                        </div>
                    ))}
                </div>
            </div>
        </nav>
    )
}
