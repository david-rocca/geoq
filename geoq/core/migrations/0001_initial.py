# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-03-31 16:27
from __future__ import unicode_literals

from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
import jsonfield.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AOI',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assignee_id', models.PositiveIntegerField(null=True)),
                ('active', models.BooleanField(default=True, help_text=b"Check to make project 'Active' and visible to all users. Uncheck this to 'Archive' the project")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('properties', jsonfield.fields.JSONField(blank=True, help_text=b'JSON key/value pairs associated with this object, e.g. {"usng":"18 S TJ 87308 14549", "favorite":"true"}', null=True)),
                ('polygon', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('priority', models.SmallIntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)], default=5, max_length=1)),
                ('status', models.CharField(choices=[(b'Unassigned', b'Unassigned'), (b'Assigned', b'Assigned'), (b'In work', b'In work'), (b'Awaiting review', b'Awaiting review'), (b'In review', b'In review'), (b'Completed', b'Completed')], default=b'Unassigned', max_length=15)),
            ],
            options={
                'verbose_name': 'Area of Interest',
                'verbose_name_plural': 'Areas of Interest',
                'permissions': (('assign_workcells', 'Assign Workcells'), ('certify_workcells', 'Certify Workcells')),
            },
        ),
        migrations.CreateModel(
            name='AOITimer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[(b'Unassigned', b'Unassigned'), (b'Assigned', b'Assigned'), (b'In work', b'In work'), (b'Awaiting review', b'Awaiting review'), (b'In review', b'In review'), (b'Completed', b'Completed')], default=b'Unassigned', max_length=20)),
                ('started_at', models.DateTimeField()),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ('user', 'aoi'),
                'permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Job',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assignee_id', models.PositiveIntegerField(null=True)),
                ('active', models.BooleanField(default=True, help_text=b"Check to make project 'Active' and visible to all users. Uncheck this to 'Archive' the project")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('properties', jsonfield.fields.JSONField(blank=True, help_text=b'JSON key/value pairs associated with this object, e.g. {"usng":"18 S TJ 87308 14549", "favorite":"true"}', null=True)),
                ('progress', models.SmallIntegerField(blank=True, max_length=2, null=True)),
                ('grid', models.CharField(choices=[(b'usng', b'usng'), (b'mgrs', b'mgrs')], default=b'usng', help_text=b'Select usng for Jobs inside the US, otherwise use mgrs', max_length=5)),
                ('tags', models.CharField(blank=True, help_text=b'Useful tags to search social media with', max_length=50, null=True)),
                ('editor', models.CharField(choices=[(b'geoq', b'geoq'), (b'osm', b'osm')], default=(b'geoq', b'geoq'), help_text=b'Editor to be used for creating features', max_length=20)),
                ('analysts', models.ManyToManyField(blank=True, null=True, related_name='analysts', to=settings.AUTH_USER_MODEL)),
                ('assignee_type', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
            ],
            options={
                'ordering': ('-created_at',),
                'permissions': (),
            },
        ),
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text=b'Short name of this organization', max_length=200, unique=True)),
                ('url', models.CharField(blank=True, help_text=b'Link that users should be directed to if icon is clicked', max_length=600, null=True)),
                ('icon', models.ImageField(blank=True, help_text=b'Upload an icon of the organization here', null=True, upload_to=b'static/organizations/')),
                ('show_on_front', models.BooleanField(default=False, help_text=b'Show on the front of the GeoQ App')),
                ('order', models.IntegerField(blank=True, default=0, help_text=b'Optionally specify the order orgs should appear on the front page. Lower numbers appear sooner.', null=True)),
            ],
            options={
                'ordering': ['order', 'name'],
                'verbose_name_plural': 'Organizations',
            },
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('active', models.BooleanField(default=True, help_text=b"Check to make project 'Active' and visible to all users. Uncheck this to 'Archive' the project")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('properties', jsonfield.fields.JSONField(blank=True, help_text=b'JSON key/value pairs associated with this object, e.g. {"usng":"18 S TJ 87308 14549", "favorite":"true"}', null=True)),
                ('project_type', models.CharField(choices=[(b'Hurricane/Cyclone', b'Hurricane/Cyclone'), (b'Tornado', b'Tornado'), (b'Earthquake', b'Earthquake'), (b'Extreme Weather', b'Extreme Weather'), (b'Fire', b'Fire'), (b'Flood', b'Flood'), (b'Tsunami', b'Tsunami'), (b'Volcano', b'Volcano'), (b'Pandemic', b'Pandemic'), (b'Exercise', b'Exercise'), (b'Special Event', b'Special Event'), (b'Training', b'Training')], max_length=50)),
                ('private', models.BooleanField(default=False, help_text=b"Check this to make this project 'Private' and available only to users assigned to it.")),
                ('contributors', models.ManyToManyField(blank=True, help_text=b'User that will be able to take on jobs.', null=True, related_name='contributors', to=settings.AUTH_USER_MODEL)),
                ('project_admins', models.ManyToManyField(blank=True, help_text=b'User that has admin rights to project.', null=True, related_name='project_admins', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-created_at',),
                'permissions': (('open_project', 'Open Project'), ('close_project', 'Close Project'), ('archive_project', 'Archive Project')),
            },
        ),
        migrations.CreateModel(
            name='Setting',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text=b'Name of site-wide variable', max_length=200)),
                ('value', jsonfield.fields.JSONField(blank=True, help_text=b'Value of site-wide variable that scripts can reference - must be valid JSON', null=True)),
            ],
        ),
    ]
