import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';

export async function POST(request) {
  try {
    const { email, phone, consent } = await request.json();

    if (!email || !phone || !consent) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Authentification avec Service Account
    const client = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await client.authorize();
    const accessToken = await client.getAccessToken();

    const timestamp = new Date().toLocaleString('fr-FR', { 
      timeZone: 'Europe/Paris'
    });

    const values = [
      timestamp,
      email,
      phone,
      consent ? 'Oui' : 'Non',
      'Application Next.js'
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/Feuille 1!A:E:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [values]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Google Sheets API:', errorData);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement des données' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Données enregistrées avec succès' 
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}