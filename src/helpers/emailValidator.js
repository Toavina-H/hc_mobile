export function emailValidator(email) {
  const re = /\S+@\S+\.\S+/
  if (!email) return "L'email ne peut pas être vide."
  if (!re.test(email)) return 'Oooups! Nous avons besoin d\'une adresse email valide.'
  return ''
}