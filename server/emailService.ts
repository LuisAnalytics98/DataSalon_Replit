import { getUncachableResendClient } from './resend.js';
import type { BookingWithDetails, Salon } from '@shared/schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function sendBookingConfirmationEmail(
  booking: BookingWithDetails,
  salon: Salon,
  confirmToken: string
): Promise<void> {
  const { client, fromEmail } = await getUncachableResendClient();

  // Use Vercel URL if available, otherwise try Replit domains, fallback to localhost
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';

  const confirmUrl = `${baseUrl}/api/bookings/${booking.id}/confirm?token=${confirmToken}`;
  const cancelUrl = `${baseUrl}/api/bookings/${booking.id}/cancel?token=${confirmToken}`;

  const appointmentDate = format(new Date(booking.appointmentDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = booking.appointmentTime;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Cita - ${salon.name}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background-color: #f8f9fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-family: 'Playfair Display', serif;
          color: #D4AF37;
          margin: 0;
          font-size: 32px;
          font-weight: 600;
        }
        .header p {
          color: #e0e0e0;
          margin: 10px 0 0;
          font-size: 16px;
        }
        .content {
          padding: 40px 30px;
        }
        .booking-details {
          background-color: #f8f9fa;
          border-left: 4px solid #D4AF37;
          padding: 25px;
          margin: 25px 0;
        }
        .booking-details h2 {
          font-family: 'Playfair Display', serif;
          color: #1a1a1a;
          margin-top: 0;
          font-size: 24px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #666;
        }
        .detail-value {
          color: #1a1a1a;
          font-weight: 500;
        }
        .action-buttons {
          text-align: center;
          margin: 35px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 35px;
          margin: 10px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .button-confirm {
          background-color: #D4AF37;
          color: #1a1a1a;
        }
        .button-confirm:hover {
          background-color: #c9a332;
        }
        .button-cancel {
          background-color: #f0f0f0;
          color: #666;
          border: 1px solid #ddd;
        }
        .button-cancel:hover {
          background-color: #e8e8e8;
        }
        .salon-info {
          background-color: #f8f9fa;
          padding: 25px;
          margin-top: 30px;
          border-radius: 8px;
        }
        .salon-info h3 {
          margin-top: 0;
          color: #1a1a1a;
          font-size: 18px;
        }
        .salon-info p {
          margin: 8px 0;
          color: #666;
        }
        .footer {
          background-color: #1a1a1a;
          color: #e0e0e0;
          text-align: center;
          padding: 25px;
          font-size: 14px;
        }
        .footer a {
          color: #D4AF37;
          text-decoration: none;
        }
        .reference {
          background-color: #fff9e6;
          border: 1px solid #D4AF37;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          border-radius: 6px;
        }
        .reference strong {
          color: #1a1a1a;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${salon.name}</h1>
          <p>Confirmación de Cita</p>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${booking.client.name}</strong>,</p>
          
          <p>¡Gracias por reservar con nosotros! A continuación encontrarás los detalles de tu cita:</p>
          
          <div class="reference">
            <strong>Referencia de Reserva: ${booking.bookingReference}</strong>
          </div>
          
          <div class="booking-details">
            <h2>Detalles de la Cita</h2>
            
            <div class="detail-row">
              <span class="detail-label">Servicio:</span>
              <span class="detail-value">${booking.service.name}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Duración:</span>
              <span class="detail-value">${booking.service.duration} min</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Profesional:</span>
              <span class="detail-value">${booking.stylist?.name || 'Por asignar'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${appointmentDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${formattedTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Precio:</span>
              <span class="detail-value">${booking.service.currency === 'dolares' ? '$' : '₡'}${booking.service.price}</span>
            </div>
            
            ${booking.service.reservationAmount ? `
            <div class="detail-row">
              <span class="detail-label">Monto de Reserva:</span>
              <span class="detail-value" style="color: #D4AF37; font-weight: 700;">${booking.service.currency === 'dolares' ? '$' : '₡'}${booking.service.reservationAmount}</span>
            </div>
            ` : ''}
          </div>
          
          ${booking.service.reservationAmount ? `
          <div style="background-color: #fff9e6; border-left: 4px solid #D4AF37; padding: 20px; margin: 25px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Por favor enviar el comprobante de pago al WhatsApp del salón con el monto de reserva. De otro modo, tu cita será cancelada.</p>
          </div>
          ` : ''}
          
          <div class="action-buttons">
            <a href="${confirmUrl}" class="button button-confirm">✓ Confirmar Cita</a>
            <a href="${cancelUrl}" class="button button-cancel">✗ Cancelar Cita</a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
            Por favor confirma o cancela tu cita usando los botones de arriba.<br>
            Este enlace expirará en 48 horas.
          </p>
          
          <div class="salon-info">
            <h3>Información de Contacto</h3>
            ${salon.phone ? `<p>📱 Teléfono: ${salon.phone}</p>` : ''}
            ${salon.email ? `<p>📧 Email: ${salon.email}</p>` : ''}
            ${salon.location ? `<p>📍 Ubicación: ${salon.location}</p>` : ''}
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            ¡Esperamos verte pronto!<br>
            <strong>Equipo de ${salon.name}</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${salon.name}. Todos los derechos reservados.</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to client
  await client.emails.send({
    from: fromEmail,
    to: booking.client.email,
    subject: `Confirmación de Cita - ${salon.name} - ${appointmentDate}`,
    html: emailHtml,
  });

  // Send copy to salon admin email if configured
  if (salon.email) {
    await client.emails.send({
      from: fromEmail,
      to: salon.email,
      subject: `Nueva Reserva - ${booking.client.name} - ${appointmentDate}`,
      html: emailHtml,
    });
  }
}
