import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { User, Bell, PlusIcon } from 'lucide-react'
import { canUploadDocuments } from '../../utils/permissions'
import Popover from '../common/popover'
import { useNotifications } from '@/hooks/useNotifications'

export default function Nav({ isOpen }) {
    const { userData } = useAuth()
    const navigate = useNavigate()

    const [userPopoverOpen, setUserPopoverOpen] = useState(false)
    const [bellPopoverOpen, setBellPopoverOpen] = useState(false)

    const {
        items: notifications,
        unseenCount,
        loading: loadingNotifications,
        markAllLoadedAsSeen,
        isSeen,
    } = useNotifications({ id_usuario: userData?.id_usuario, pageSize: 30 })

    const initials = useMemo(() => {
        const n = userData?.nombre?.trim?.() || ''
        const a = userData?.apellido?.trim?.() || ''
        if (!n || !a) return '??'
        return (n.charAt(0) + a.charAt(0)).toUpperCase()
    }, [userData?.nombre, userData?.apellido])

    return (
        <nav className='p-2 w-full overflow-visible'>
            <div className={`flex items-center justify-between gap-2 ${isOpen ? 'pl-52' : 'pl-20'} transition-all duration-300`}>
                {userData && (
                    <p className='text-base text'>Bienvenido, {userData.nombre} {userData.apellido}</p>
                )}
                <div className='flex items-center justify-end w-1/3 gap-2'>
                    <Popover
                        open={userPopoverOpen}
                        onOpenChange={(v) => {
                            setUserPopoverOpen(v)
                            if (v) setBellPopoverOpen(false)
                        }}
                        align="end"
                        widthClass="w-[340px]"
                        trigger={({ open, toggle }) => (
                            <button
                                type="button"
                                onClick={toggle}
                                className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                aria-label="Abrir perfil"
                                aria-expanded={open}
                            >
                                <User className='w-6 h-6' />
                            </button>
                        )}
                    >
                        <div className="p-4">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 border-4 border-purple-950 rounded-full flex items-center justify-center">
                                    <span className="text-purple-950 text-3xl font-mono">{initials}</span>
                                </div>
                                <div className="mt-3 font-semibold text-gray-900">
                                    {userData?.nombre || '-'} {userData?.apellido || ''}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    {userData?.roles?.nombre_rol || 'Sin rol'} •{' '}
                                    {userData?.disciplinas?.tipo
                                        ? userData.disciplinas.tipo
                                        : userData?.disciplinas?.descripcion || 'Sin disciplina'}
                                </div>
                                {userData?.lider_equipo ? (
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-xs">
                                            Líder de proyecto
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-4 pt-4 border-t border-purple-100 space-y-2 text-sm text-gray-800">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500">Rol</span>
                                    <span className="font-medium">{userData?.roles?.nombre_rol || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500">Disciplina</span>
                                    <span className="font-medium">
                                        {userData?.disciplinas?.tipo
                                            ? `${userData.disciplinas.tipo} - ${userData?.disciplinas?.descripcion || ''}`
                                            : userData?.disciplinas?.descripcion || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium truncate max-w-[220px]">
                                        {userData?.email_empresa || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-gray-500">DNI</span>
                                    <span className="font-medium">{userData?.dni != null ? userData.dni : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </Popover>

                    <Popover
                        open={bellPopoverOpen}
                        onOpenChange={async (v) => {
                            setBellPopoverOpen(v)
                            if (v) {
                                setUserPopoverOpen(false)
                                await markAllLoadedAsSeen()
                            }
                        }}
                        align="end"
                        widthClass="w-[380px]"
                        trigger={({ open, toggle }) => (
                            <button
                                type="button"
                                onClick={toggle}
                                className="relative p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                aria-label="Abrir notificaciones"
                                aria-expanded={open}
                            >
                                <Bell className='w-6 h-6' />
                                {unseenCount > 0 ? (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                                        {unseenCount > 99 ? '99+' : unseenCount}
                                    </span>
                                ) : null}
                            </button>
                        )}
                    >
                        <div className="p-4 border-b border-purple-100">
                            <div className="font-semibold text-purple-700">Notificaciones</div>
                            <div className="text-xs text-gray-500">
                                {loadingNotifications ? 'Cargando…' : 'Actividad del sistema'}
                            </div>
                        </div>
                        <div className="max-h-[420px] overflow-auto">
                            {!notifications || notifications.length === 0 ? (
                                <div className="p-4 text-sm text-gray-700">No hay notificaciones por ahora.</div>
                            ) : (
                                <div className="divide-y divide-purple-50">
                                    {notifications.map((n) => {
                                        const seen = isSeen(n.id_notificacion)
                                        const date = n?.created_at ? new Date(n.created_at) : null
                                        const when = date
                                            ? new Intl.DateTimeFormat('es-AR', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            }).format(date)
                                            : ''

                                        return (
                                            <div
                                                key={n.id_notificacion}
                                                className={
                                                    'p-4 text-sm ' +
                                                    (seen ? 'bg-white' : 'bg-purple-50/50')
                                                }
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">
                                                            {n.titulo || 'Notificación'}
                                                        </div>
                                                        <div className="text-gray-700 mt-0.5">
                                                            {n.mensaje || '-'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">{when}</div>
                                                    </div>
                                                    {!seen ? (
                                                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Popover>

                    {userData && userData.roles ? (
                        canUploadDocuments(userData) ? (
                            <button
                                type="button"
                                onClick={() => navigate('/documents', { state: { openUploadFromNav: true } })}
                                className="flex items-center whitespace-nowrap gap-1 bg-purple-600 text-white px-2 py-2.5 rounded-full hover:bg-purple-700 transition-colors"
                            >
                                <PlusIcon className='w-6 h-6' />
                                Agregar Documento
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate('/documents', {
                                        state: {
                                            toastFromNav: {
                                                type: 'error',
                                                message: 'Funcionalidad de HH en desarrollo.',
                                            },
                                        },
                                    })
                                }
                                className="flex items-center whitespace-nowrap gap-1 bg-purple-600 text-white px-2 py-2.5 rounded-full hover:bg-purple-700 transition-colors"
                            >
                                <PlusIcon className='w-6 h-6' />
                                Agregar HH
                            </button>
                        )
                    ) : null}
                </div>
            </div>
        </nav>
    )
}
