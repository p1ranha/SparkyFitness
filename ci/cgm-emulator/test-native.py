"""Real Android UI test. API data is synthetic; components, Skia and gestures are native."""
import json
import re
import time
from pathlib import Path
import uiautomator2 as u2

PACKAGE = 'org.SparkyApps.SparkyFitnessMobile1.dev'
out = Path('emulator-artifacts')
out.mkdir(exist_ok=True)
d = u2.connect()

def wait_for(check, message, seconds=30):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        if check():
            return
        time.sleep(.25)
    raise AssertionError(message)

def click(label):
    for field in ['description', 'text']:
        node = d(**{field: label})
        if node.exists:
            node.click()
            return
    raise AssertionError('Missing native control: ' + label)

def scroll_to(pattern):
    d(scrollable=True).scroll.vert.to(textMatches=pattern)

def events_count():
    text = d(textMatches='Events in view.*').get_text()
    return int(re.search(r'(\d+)\s*$', text).group(1))

passed = []
try:
    d.app_clear(PACKAGE)
    d.app_start(PACKAGE, stop=True)
    wait_for(lambda: d(text='Blood glucose (CGM)').exists, 'CGM component did not load', 90)
    wait_for(lambda: d(textMatches='.*mmol/L').exists, 'Default glucose readout missing')
    d.screenshot(str(out / '01-default-unit.png'))
    click('Glucose unit')
    wait_for(lambda: d(description='mg/dL').exists, 'Native unit picker did not open')
    click('mg/dL')
    wait_for(lambda: d(textMatches='.*mg/dL').exists, 'Chart did not follow saved unit')
    d.screenshot(str(out / '02-mgdl.png'))
    passed.append('Actual native setting changes chart units')
    d.app_stop(PACKAGE)
    d.app_start(PACKAGE)
    wait_for(lambda: d(textMatches='.*mg/dL').exists, 'Fixture preference did not survive process restart', 60)
    passed.append('Native fixture preference survives process restart (AsyncStorage, not database)')
    scroll_to('Events in view.*')
    before = events_count()
    plot = d(resourceId='measurement-timeline-plot')
    if not plot.exists:
        raise AssertionError('Native plot test target is missing')
    plot.pinch_out(percent=75, steps=40)
    wait_for(lambda: events_count() < before, 'Pinch did not narrow the visible event window')
    d.screenshot(str(out / '03-pinched-chart.png'))
    passed.append('Actual two-finger pinch updates visible events')
    bounds = plot.info['bounds']
    y = (bounds['top'] + bounds['bottom']) // 2
    d.swipe(bounds['right'] - 30, y, bounds['left'] + 30, y, duration=.5)
    time.sleep(1)
    d.screenshot(str(out / '04-panned-chart.png'))
    scroll_to('Reset zoom')
    click('Reset zoom')
    scroll_to('Events in view.*')
    wait_for(lambda: events_count() == before, 'Reset did not restore the full event window')
    passed.append('Horizontal pan executes and reset restores the full event count')
    scroll_to('Event details.*')
    node = d(textMatches='Event details.*')
    if node.exists:
        node.click()
    else:
        d(descriptionMatches='Event details.*').click()
    scroll_to('.*15:30.*16:15.*')
    assert d(textMatches='.*15:30.*16:15.*').exists, 'Workout interval is missing'
    d.screenshot(str(out / '05-exercise-start-end.png'))
    passed.append('Native event details show exercise start and end')
    scroll_to('Blood glucose \\(CGM\\)')
    click('Chart options')
    click('Measurement')
    click('Imported CGM')
    wait_for(lambda: d(textMatches='.*110 mg/dL').exists, 'Imported category is missing or was converted twice')
    d.screenshot(str(out / '06-imported-category.png'))
    passed.append('API-source custom CGM category is visible with its original unit')
    (out / 'results.json').write_text(json.dumps({'passed': passed, 'failed': []}, indent=2))
    print(json.dumps({'passed': passed}, indent=2))
except BaseException as error:
    d.screenshot(str(out / 'failure.png'))
    (out / 'failure-hierarchy.xml').write_text(d.dump_hierarchy())
    (out / 'results.json').write_text(json.dumps({'passed': passed, 'failed': [str(error)]}, indent=2))
    raise
