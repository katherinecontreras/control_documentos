import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/logo.ico'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function SideBar({ isOpen, setIsOpen, navItems }) {
    const { userData , signOut} = useAuth()
    const navigate = useNavigate()
    
    const inicials = userData?.nombre && userData?.apellido 
        ? (userData.nombre.charAt(0) + userData.apellido.charAt(0)).toUpperCase()
        : '??'

    const handleSignOut = async () => {
        try {
            await signOut()
            navigate('/')
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
        }
    }
    
    return (
        <div onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} className={`fixed rounded-full top-0 left-0 mx-2 my-2 h-screen bg-white shadow-xl transition-all duration-300 
        ${isOpen ? 'w-52 px-2' : ' w-16'}`}>
            <div className='flex flex-col items-center justify-between my-4 w-full h-full'>
                <div>
                    <img src={logo} alt="logo" className='w-10 h-10' />
                </div>
                <div className='gap-4 flex flex-col items-start'>
                    {navItems.map((item,index) => (
                        <Link
                          key={index}
                          to={item.path}
                          className="flex items-center justify-start gap-2 cursor-pointer hover:bg-purple-100 rounded-full p-2 w-full transition-all duration-300"
                        >
                          <div className="w-10 text-white h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            {item.icon}
                          </div>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm font-mono whitespace-nowrap"
                              >
                                {item.name}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </Link>
                    ))}
                </div>
                <div onClick={handleSignOut} className='flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-500 hover:text-white rounded-full p-2 w-full transition-all duration-300'>
                    <div className='w-10 text-white h-10 bg-purple-950 rounded-full flex items-center justify-center'>
                        <LogOut className='w-6 h-6' />
                    </div>
                    <AnimatePresence>
                        {isOpen && (
                            <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-mono whitespace-nowrap"
                            >
                            Cerrar Sesión
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
                <div className='w-10 mb-10 h-10 border-3 border-purple-950 rounded-full flex items-center justify-center'>
                    <p className='text-purple-950 text-2xl font-mono'>{inicials}</p>
                </div>
            </div>
        </div>
    )
}
