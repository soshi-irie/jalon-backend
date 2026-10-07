import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export type RouteCoordinates = {
  lat: number;
  lng: number;
};

export type RouteRequest = {
  origin: RouteCoordinates;
  destination: RouteCoordinates;
};

export type RideRequest = {
  driverOrigin: RouteCoordinates;
  riderOrigin: RouteCoordinates;
  riderDestination: RouteCoordinates;
  driverDestination: RouteCoordinates;
};

type GoogleRoutesResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
  }>;
};

function isRouteCoordinates(value: unknown): value is RouteCoordinates {
  if (typeof value !== 'object' || value === null) return false;

  const coordinates = value as Record<string, unknown>;
  return (
    typeof coordinates.lat === 'number' &&
    Number.isFinite(coordinates.lat) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lng) &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
}

type RouteResult = {
  encodedPolyline: string;
  distanceMeters: number;
  duration: string;
};

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getRoute(origin: unknown, destination: unknown): Promise<RouteResult> {
    if (!isRouteCoordinates(origin) || !isRouteCoordinates(destination)) {
      throw new BadRequestException(
        'origin and destination must each contain valid lat and lng coordinates',
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Maps API key is not configured',
      );
    }

    let response: Response;
    try {
      response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: { latitude: origin.lat, longitude: origin.lng },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destination.lat,
                  longitude: destination.lng,
                },
              },
            },
            travelMode: 'DRIVE',
          }),
        },
      );
    } catch {
      throw new BadGatewayException('Could not connect to Google Routes API');
    }

    if (!response.ok) {
      throw new BadGatewayException('Google Routes API returned an error');
    }

    const result = (await response.json()) as GoogleRoutesResponse;
    const route = result.routes?.[0];
    const encodedPolyline = route?.polyline?.encodedPolyline;

    if (
      !route ||
      !encodedPolyline ||
      route.distanceMeters === undefined ||
      route.duration === undefined
    ) {
      throw new NotFoundException('No driving route found');
    }

    return {
      encodedPolyline,
      distanceMeters: route.distanceMeters,
      duration: route.duration,
    };
  }

  async getRouteWithPassenger({driverOrigin, riderOrigin, riderDestination, driverDestination}: RideRequest): Promise<RouteResult> {
    if (!isRouteCoordinates(driverOrigin) || !isRouteCoordinates(riderOrigin) || !isRouteCoordinates(riderDestination) || !isRouteCoordinates(driverDestination)) {
      throw new BadRequestException(
        'origin and destination must each contain valid lat and lng coordinates',
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Maps API key is not configured',
      );
    }

    let response: Response;
    try {
      response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify({
            origin: {
    location: {
      latLng: {
        latitude: driverOrigin.lat,
        longitude: driverOrigin.lng,
      },
    },
  },
  destination: {
    location: {
      latLng: {
        latitude: driverDestination.lat,
        longitude: driverDestination.lng,
      },
    },
      },
      intermediates: [
        {
          location: {
            latLng: {
              latitude: riderOrigin.lat,
              longitude: riderOrigin.lng,
            },
          },
        },
        {
          location: {
            latLng: {
              latitude: riderDestination.lat,
              longitude: riderDestination.lng,
            },
          },
        },
      ],
      travelMode: 'DRIVE',
          }),
        },
      );
    } catch {
      throw new BadGatewayException('Could not connect to Google Routes API');
    }

    if (!response.ok) {
      throw new BadGatewayException('Google Routes API returned an error');
    }

    const result = (await response.json()) as GoogleRoutesResponse;
    const route = result.routes?.[0];
    const encodedPolyline = route?.polyline?.encodedPolyline;

    if (
      !route ||
      !encodedPolyline ||
      route.distanceMeters === undefined ||
      route.duration === undefined
    ) {
      throw new NotFoundException('No driving route found');
    }

    return {
      encodedPolyline,
      distanceMeters: route.distanceMeters,
      duration: route.duration,
    };
  }
}
