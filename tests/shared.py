from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict, field


@dataclass
class Proxy:
    server: str
    username: Optional[str] = None
    password: Optional[str] = None

@dataclass
class ViewPort:
    width: int = 1280
    height: int = 720


@dataclass
class GeoLocation:
    # longitude: float=-34.6156548
    # latitude: float = -58.5156983
    longitude: float=40.697631
    latitude: float = -74.144485

@dataclass
class Emulation:
    # locale: str = "es-AR"
    # timezoneId: str = "America/Argentina/Buenos_Aires"
    locale: str = "en-US"
    timezoneId: str = "America/New_York"
    isMobile: bool = False
    viewport: ViewPort = ViewPort()
    geoEnabled: bool = False
    geolocation: GeoLocation = GeoLocation()

@dataclass
class CrawlTask:
    url: str
    ts: int = 120
    waitElement: Optional[str] = None
    screenshot: bool = False
    headers: Dict[str, Any] = field(default_factory=dict)
    proxy: Optional[Proxy] = None
    emulation: Optional[Emulation] = field(default_factory=Emulation)