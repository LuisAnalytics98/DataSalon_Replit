import { getUncachableResendClient } from './resend.js';
import type { BookingWithDetails, Salon } from '../shared/schema.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { storage } from './storage.js';

export async function sendBookingConfirmationEmail(
  booking: BookingWithDetails,
  salon: Salon,
  confirmToken: string
): Promise<void> {
  try {
    // Validate that we have the necessary data
    if (!booking.client?.email) {
      const errorMsg = 'Client email is missing from booking data';
      console.error(`❌ ${errorMsg}`, { bookingId: booking.id, bookingReference: booking.bookingReference });
      throw new Error(errorMsg);
    }

    if (!booking.client.email.includes('@')) {
      const errorMsg = `Invalid client email format: ${booking.client.email}`;
      console.error(`❌ ${errorMsg}`, { bookingId: booking.id });
      throw new Error(errorMsg);
    }

    console.log(`📧 Preparing to send emails for booking ${booking.id} (${booking.bookingReference})`);
    console.log(`   Client: ${booking.client.name} <${booking.client.email}>`);
    console.log(`   Salon: ${salon.name} (${salon.id})`);

    let client, fromEmail;
    try {
      const resendClient = await getUncachableResendClient();
      client = resendClient.client;
      fromEmail = resendClient.fromEmail;
      
      console.log(`📧 Resend client initialized. From email: ${fromEmail}`);
      
      if (!fromEmail || fromEmail === 'noreply@resend.dev') {
        console.warn('⚠️ Using default Resend email address. Consider setting RESEND_FROM_EMAIL environment variable with a verified domain.');
        console.warn('   Note: Emails from noreply@resend.dev may have delivery limitations.');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Resend client:', {
        error: error.message || error,
        stack: error.stack,
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      });
      throw new Error(`Failed to initialize email service: ${error.message || 'Unknown error'}`);
    }

  // Use Vercel URL if available, otherwise try Replit domains, fallback to localhost
  // VERCEL_URL might already include https://, so check for that
  let baseUrl = 'http://localhost:5000';
  if (process.env.VERCEL_URL) {
    baseUrl = process.env.VERCEL_URL.startsWith('http')
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  } else if (process.env.REPLIT_DOMAINS) {
    baseUrl = `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  }
  
  console.log(`📧 Using base URL for email links: ${baseUrl}`);

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
    console.log(`📧 Attempting to send confirmation email to client: ${booking.client.email}`);
    const clientEmailResult = await client.emails.send({
      from: fromEmail,
      to: booking.client.email,
      subject: `Confirmación de Cita - ${salon.name} - ${appointmentDate}`,
      html: emailHtml,
    });

    if (clientEmailResult.error) {
      console.error('❌ Error sending email to client:', {
        error: clientEmailResult.error,
        email: booking.client.email,
        bookingId: booking.id,
      });
      throw new Error(`Failed to send email to client: ${JSON.stringify(clientEmailResult.error)}`);
    }
    console.log(`✅ Email sent successfully to client: ${booking.client.email} (Email ID: ${clientEmailResult.data?.id || 'N/A'})`);

    // Get all salon owners and admins to send notification
    let adminEmails: string[] = [];
    try {
      const salonUsers = await storage.getSalonUsers(salon.id);
      adminEmails = salonUsers
        .filter(su => (su.role === 'owner' || su.role === 'admin') && su.user?.email)
        .map(su => su.user!.email)
        .filter((email): email is string => !!email && email.trim().length > 0);
      
      console.log(`📧 Found ${adminEmails.length} admin/owner email(s) for salon ${salon.name}`);
    } catch (error: any) {
      console.error('❌ Error fetching salon users for email notification:', error);
      // Don't throw - we can still send to the client even if admin emails fail
    }

    // Send copy to all salon admins/owners with a notification-style email
    if (adminEmails.length > 0) {
      console.log(`📧 Attempting to send notification emails to ${adminEmails.length} admin(s)/owner(s)`);
      
      // Create admin notification email (different from client email)
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Reserva - ${salon.name}</title>
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
            .content {
              padding: 40px 30px;
            }
            .notification-badge {
              background-color: #D4AF37;
              color: #1a1a1a;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 20px;
            }
            .booking-details {
              background-color: #f8f9fa;
              border-left: 4px solid #D4AF37;
              padding: 25px;
              margin: 25px 0;
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
            .action-button {
              display: inline-block;
              padding: 14px 35px;
              margin: 20px 0;
              background-color: #D4AF37;
              color: #1a1a1a;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background-color: #1a1a1a;
              color: #e0e0e0;
              text-align: center;
              padding: 25px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${salon.name}</h1>
              <p style="color: #e0e0e0; margin: 10px 0 0;">Nueva Reserva Recibida</p>
            </div>
            
            <div class="content">
              <div class="notification-badge">NUEVA RESERVA</div>
              
              <p>Has recibido una nueva reserva en tu salón:</p>
              
              <div class="booking-details">
                <h2 style="font-family: 'Playfair Display', serif; color: #1a1a1a; margin-top: 0; font-size: 24px;">Detalles de la Reserva</h2>
                
                <div class="detail-row">
                  <span class="detail-label">Referencia:</span>
                  <span class="detail-value"><strong>${booking.bookingReference}</strong></span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Cliente:</span>
                  <span class="detail-value">${booking.client.name}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Email del Cliente:</span>
                  <span class="detail-value">${booking.client.email}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Teléfono del Cliente:</span>
                  <span class="detail-value">${booking.client.phone}</span>
                </div>
                
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
              
              <div style="text-align: center;">
                <a href="${baseUrl}/admin" class="action-button">Ver en Panel de Administración</a>
              </div>
              
              ${booking.client.notes ? `
              <div style="background-color: #fff9e6; border-left: 4px solid #D4AF37; padding: 20px; margin: 25px 0;">
                <p style="margin: 0; color: #856404;"><strong>Notas del Cliente:</strong> ${booking.client.notes}</p>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${salon.name}. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const adminEmailPromises = adminEmails.map(async (adminEmail) => {
        try {
          const adminEmailResult = await client.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `🔔 Nueva Reserva - ${booking.client.name} - ${appointmentDate} ${formattedTime}`,
            html: adminEmailHtml,
          });

          if (adminEmailResult.error) {
            console.error(`❌ Error sending email to admin ${adminEmail}:`, {
              error: adminEmailResult.error,
              email: adminEmail,
              bookingId: booking.id,
            });
            return { success: false, email: adminEmail, error: adminEmailResult.error };
          }
          console.log(`✅ Email sent successfully to admin: ${adminEmail} (Email ID: ${adminEmailResult.data?.id || 'N/A'})`);
          return { success: true, email: adminEmail };
        } catch (error: any) {
          console.error(`❌ Exception sending email to admin ${adminEmail}:`, {
            error: error.message || error,
            email: adminEmail,
            bookingId: booking.id,
          });
          return { success: false, email: adminEmail, error: error.message || String(error) };
        }
      });

      const adminResults = await Promise.allSettled(adminEmailPromises);
      const failedAdmins = adminResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      const successfulAdmins = adminResults
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
        );

      console.log(`📊 Admin email summary: ${successfulAdmins.length} succeeded, ${failedAdmins.length} failed`);

      if (failedAdmins.length > 0) {
        console.warn(`⚠️ Some admin emails failed to send:`, failedAdmins);
      }
    } else {
        console.warn(`⚠️ No admin/owner emails found for salon ${salon.name} (ID: ${salon.id}). Make sure salon users have email addresses.`);
    }
  } catch (error: any) {
    console.error('❌ Error in sendBookingConfirmationEmail:', {
      error: error.message || error,
      stack: error.stack,
      bookingId: booking.id,
      clientEmail: booking.client?.email,
      salonId: salon.id,
    });
    throw error; // Re-throw to allow caller to handle
  }
}
