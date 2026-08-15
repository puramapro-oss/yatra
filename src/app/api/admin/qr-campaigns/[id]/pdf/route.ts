import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!isSuperAdmin(user.email ?? null)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const svc = createServiceClient()

    const { data: campaign } = await svc
      .from('qr_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    }

    // Générer QR code en data URL
    const qrUrl = `https://yatra.purama.dev/scan/${campaign.campaign_slug}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0A0A0F',
        light: '#FFFFFF',
      },
    })

    // Créer PDF A4 portrait (210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20

    // Fond blanc
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Logo YATRA en haut (texte simple)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(32)
    doc.setTextColor(124, 58, 237) // violet primary
    doc.text('YATRA', pageWidth / 2, margin + 15, { align: 'center' })

    // Accroche
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text('Voyage plus loin, paye moins cher.', pageWidth / 2, margin + 28, {
      align: 'center',
    })

    // QR code centré
    const qrSize = 120
    const qrX = (pageWidth - qrSize) / 2
    const qrY = margin + 45
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    // Instructions scan
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    const instructionY = qrY + qrSize + 15
    doc.text('Scannez ce QR code pour découvrir YATRA', pageWidth / 2, instructionY, {
      align: 'center',
    })

    // Infos partenaire en bas
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const partnerY = instructionY + 20
    doc.text(`Partenaire : ${campaign.partner_name}`, pageWidth / 2, partnerY, {
      align: 'center',
    })
    doc.text(`${campaign.location_name} · ${campaign.city}`, pageWidth / 2, partnerY + 6, {
      align: 'center',
    })

    // Footer URL
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('yatra.purama.dev', pageWidth / 2, pageHeight - margin, { align: 'center' })

    // Générer PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="yatra-kit-print-${campaign.campaign_slug}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[QR PDF] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
