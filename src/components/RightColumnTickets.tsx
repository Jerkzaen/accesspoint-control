import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Ticket } from '@/types/ticket'
import { 
  Clock, 
  Filter, 
  TrendingUp, 
  FileText, 
  Download,
  Search,
  Calendar
} from 'lucide-react'

interface RightColumnTicketsProps {
  selectedTicket?: Ticket | null
  onFilterChange?: (filters: any) => void
  onExportBitacora?: () => void
}

function RightColumnTickets({ 
  selectedTicket,
  onFilterChange,
  onExportBitacora 
}: RightColumnTicketsProps) {
  return (
    <div className="w-80 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 space-y-4">
          {/* Resumen de Estadísticas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Resumen del Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant="outline" className="w-full justify-center">
                    {selectedTicket?.estado || 'No seleccionado'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Prioridad</p>
                  <Badge variant="outline" className="w-full justify-center">
                    {selectedTicket?.prioridad || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros Rápidos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Últimas 24 horas
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Mis tickets
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Frecuentes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Acciones Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar en bitácora
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={onExportBitacora}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar bitácora
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Acciones */}
          {selectedTicket && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Timeline de Acciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aquí iría el componente de timeline */}
                  <p className="text-sm text-muted-foreground text-center">
                    Timeline en desarrollo...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default RightColumnTickets