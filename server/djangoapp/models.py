from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


# Create your models here.

class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    country_of_origin = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CarModel(models.Model):
    # Type choices
    TYPE_CHOICES = [
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('WAGON', 'Station Wagon'),
        ('COUPE', 'Coupe'),
        ('CONVERTIBLE', 'Convertible'),
        ('HATCHBACK', 'Hatchback'),
        ('TRUCK', 'Pickup Truck'),
        ('VAN', 'Minivan'),
    ]

    # Model fields
    car_make = models.ForeignKey(
        CarMake,
        on_delete=models.CASCADE,
        related_name='models'
    )
    name = models.CharField(max_length=100)
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='SEDAN'
    )
    year = models.IntegerField(
        validators=[
            MinValueValidator(2015),
            MaxValueValidator(2023)
        ]
    )
    engine_size = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        help_text="Engine size in liters",
        null=True,
        blank=True
    )
    horsepower = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    price = models.PositiveIntegerField(
        help_text="Base price in USD",
        null=True,
        blank=True
    )
    production_start = models.DateField(
        help_text="Production start date",
        null=True,
        blank=True
    )
    discontinued = models.BooleanField(default=False)

    class Meta:
        ordering = ['-year', 'name']
        unique_together = ['car_make', 'name', 'year']

    def __str__(self):
        return f"{self.car_make.name} {self.name} ({self.year})"
