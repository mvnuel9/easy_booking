from django.core.management.base import BaseCommand

from rooms.models import Room


class Command(BaseCommand):
    help = "Crée les salles de démonstration EasyBooking."

    def handle(self, *args, **options):
        rooms = [
            ("L’Atelier", 8, ["Écran", "Visioconférence"], "Une salle lumineuse pour les réunions d’équipe."),
            ("Le Studio", 4, ["Écran", "Tableau blanc"], "Un espace calme pour les petits groupes."),
            ("La Verrière", 12, ["Écran", "Visioconférence", "Tableau blanc"], "Un grand espace modulable pour vos ateliers."),
            ("Le Salon", 6, ["Tableau blanc"], "Un cadre confortable pour échanger et décider."),
        ]
        for name, capacity, equipment, description in rooms:
            Room.objects.update_or_create(
                name=name,
                defaults={"capacity": capacity, "equipment": equipment, "description": description, "is_active": True},
            )
        self.stdout.write(self.style.SUCCESS(f"{len(rooms)} salles de démonstration sont disponibles."))