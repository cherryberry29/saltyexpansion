# Generated by Django 4.2.2 on 2024-06-04 06:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('djapp', '0003_sprint_sprintname_alter_sprint_end_date_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sprint',
            name='sprintName',
            field=models.CharField(default='', max_length=20, unique=True),
        ),
    ]
