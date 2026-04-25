"""
Usage:
    python manage.py seed_quotes
    python manage.py seed_quotes --user admin        # assign to a specific username
    python manage.py seed_quotes --count 50          # generate a different number
"""

import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from quotations.models import Quotes

User = get_user_model()

SAMPLE_QUOTES = [
    "The only way to do great work is to love what you do.",
    "In the middle of every difficulty lies opportunity.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Life is what happens when you're busy making other plans.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is during our darkest moments that we must focus to see the light.",
    "Whoever is happy will make others happy too.",
    "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    "You will face many defeats in life, but never let yourself be defeated.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "In the end, it's not the years in your life that count. It's the life in your years.",
    "Never let the fear of striking out keep you from playing the game.",
    "Life is either a daring adventure or nothing at all.",
    "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",
    "If life were predictable it would cease to be life, and be without flavor.",
    "If you look at what you have in life, you'll always have more.",
    "If you want to live a happy life, tie it to a goal, not to people or things.",
    "Never let the fear of striking out keep you from playing the game.",
    "Money and success don't change people; they merely amplify what is already there.",
    "Your time is limited, so don't waste it living someone else's life.",
    "Not how long, but how well you have lived is the main thing.",
    "If you are not willing to risk the usual, you will have to settle for the ordinary.",
    "All our dreams can come true, if we have the courage to pursue them.",
    "The secret of getting ahead is getting started.",
]


class Command(BaseCommand):
    help = 'Seed the database with sample quotes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            default=None,
            help='Username to assign quotes to (defaults to the first superuser found)',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of quotes to create (default: 20)',
        )

    def handle(self, *args, **options):
        username = options['user']
        count    = options['count']

        # ── Resolve user ──────────────────────────────────────────────────────
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stderr.write(self.style.ERROR(f'User "{username}" not found.'))
                return
        else:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()
            if not user:
                self.stderr.write(self.style.ERROR(
                    'No users exist in the database. '
                    'Create one first with: python manage.py createsuperuser'
                ))
                return

        self.stdout.write(f'Seeding {count} quotes as user "{user.username}" ...')

        # ── Create quotes ─────────────────────────────────────────────────────
        pool   = SAMPLE_QUOTES * (count // len(SAMPLE_QUOTES) + 1)  # repeat if needed
        sample = random.sample(pool, count)

        created = []
        for text in sample:
            quote = Quotes.objects.create(
                quote      = text,
                created_by = user,
                updated_by = user,
            )
            created.append(quote)

        # ── Report ────────────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            f'✓ Successfully created {len(created)} quotes.'
        ))
        for q in created:
            self.stdout.write(f'  [{q.id}] {q.quote[:60]}...' if len(q.quote) > 60 else f'  [{q.id}] {q.quote}')