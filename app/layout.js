import 'bootstrap/dist/css/bootstrap.min.css'
    import './globals.css'

    export const metadata = {
      title: 'Login App',
      description: 'Next.js + Tailwind CSS Login App',
    }

    export default function RootLayout({ children }) {
      return (
        <html lang="en">
          <body>{children}</body>
        </html>
      )
    }
