export const metadata = {
  title: "JobFlow — recherche d'emploi automatisée",
  description: "Flux d'offres filtré, scoring, CV adaptatif et lettres de motivation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
