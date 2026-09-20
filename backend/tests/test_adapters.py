import asyncio
from app.adapters.garud import GarudMPAdapter
from app.adapters.sources import BhuvanAdapter, MPEserviceAdapter, OpenStreetMapAdapter
from app.adapters.sarvam import SarvamAIAdapter


def test_garud_adapter_contract():
    adapter = GarudMPAdapter()
    assert adapter.source_key == "garud_mp_uadd"
    assert adapter.is_authoritative is True
    assert adapter.requires_credentials is True
    attribution = adapter.get_attribution("en")
    assert "Directorate of Urban Administration & Development" in attribution


def test_bhuvan_adapter_contract():
    adapter = BhuvanAdapter()
    assert adapter.source_key == "isro_bhuvan_wms"
    assert adapter.is_authoritative is True
    attribution_hi = adapter.get_attribution("hi")
    assert "इसरो भुवन" in attribution_hi


def test_sarvam_adapter_fallback():
    adapter = SarvamAIAdapter()
    summary = asyncio.run(adapter.generate_grounded_summary("Gwalior Road", {}, language="hi"))
    assert len(summary) > 0
