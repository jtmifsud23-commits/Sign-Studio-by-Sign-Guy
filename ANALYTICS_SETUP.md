# Sign Studio GTM + GA4 setup

The app loads the Sign Studio Google Tag Manager Web container `GTM-MDH5QLKP`. Its Sign Studio events should be sent to GA4 measurement ID `G-1L08WWTLD5`.

## Current status (June 23, 2026)

- GTM Version 4, **Scope Sign Studio analytics**, is published and live.
- The Google tag is restricted to `sign-studio-by-sign-guy.vercel.app`, preventing duplicate page views on the main My Sign Guy site.
- The six Sign Studio custom events are routed to GA4 property **My Sign Guy** (`G-1L08WWTLD5`).
- `generate_lead` is registered and marked as a GA4 key event.
- Google has temporarily paused both GTM tags after its automated malware scanner flagged them. Search Console reports no security issues for `mysignguy.ca`. Do not manually unpause the tags; request review and allow Google's automatic rescan to clear the hold.

## 1. Create or choose the GA4 property

1. Sign in at <https://analytics.google.com/>.
2. If MySignGuy already has a GA4 property, use that property so the storefront and Sign Studio are reported together. Otherwise, go to **Admin → Create → Property** and create one.
3. Set the reporting timezone to **America/Toronto** and currency to **CAD**.
4. Go to **Admin → Data collection and modification → Data streams**.
5. Open the Sign Studio web stream for `https://sign-studio-by-sign-guy.vercel.app`.
6. Confirm its Measurement ID is `G-1L08WWTLD5`.

Do not also install a direct GA4 `gtag.js` snippet in Sign Studio. GTM will own the Google tag; installing both can duplicate page views and events.

## 2. Create the GTM container

1. Sign in at <https://tagmanager.google.com/>.
2. Create an account if needed, then create a container named **Sign Studio** with target platform **Web**.
3. Confirm the container ID is `GTM-MDH5QLKP`.
4. Deploy the updated site.

Sign Studio requires JavaScript to run, so its loader intentionally omits GTM's no-JavaScript iframe fallback.

## 3. Add the Google tag in GTM

1. In the GTM container, go to **Tags → New**.
2. Name it **Google tag – Sign Studio**.
3. Choose **Google tag** and enter `G-1L08WWTLD5` as the Tag ID.
4. Create an **Initialization** trigger that fires only when **Page Hostname equals `sign-studio-by-sign-guy.vercel.app`** and attach it to the tag.
5. Save.

This tag handles GA4 page views and automatically collected events.

## 4. Forward Sign Studio events to GA4

### Create the trigger

1. Go to **Triggers → New → Custom Event**.
2. Name it **Custom Event – Sign Studio analytics**.
3. Enable **Use regex matching** and enter:

   `^(sign_up|select_item|artwork_upload|save_design|add_to_cart|generate_lead)$`

4. Fire on **All Custom Events** and save.

### Create data layer variables

Create a **Data Layer Variable** (Version 2) for each name below. The GTM variable name can be `DLV – <name>`:

- `event_source`
- `method`
- `product_type`
- `file_type`
- `save_destination`
- `lead_source`

Use GTM's built-in `{{Event}}` variable for the event name. If it is not available, create one more Data Layer Variable whose Data Layer Variable Name is `event`.

### Create the GA4 Event tag

1. Go to **Tags → New** and name it **GA4 Event – Sign Studio events**.
2. Choose **Google Analytics: GA4 Event**.
3. Select the Sign Studio Google tag, or enter the same `G-` Measurement ID if the UI requests it.
4. Set **Event Name** to `{{Event}}`.
5. Add these event parameters, each mapped to its matching `DLV – ...` variable:

   - `event_source`
   - `method`
   - `product_type`
   - `file_type`
   - `save_destination`
   - `lead_source`

6. Under the tag's ecommerce settings, enable **Send Ecommerce data** and choose **Data Layer** as the source. This carries the `select_item` and `add_to_cart` item data.
7. Attach **Custom Event – Sign Studio analytics** as the trigger and save.

## 5. Test, publish, and verify

1. In GTM, click **Preview**, connect to `https://sign-studio-by-sign-guy.vercel.app`, and complete a short test journey.
2. Confirm the Google tag fires once and that the relevant GA4 Event tag fires for the actions below.
3. In GA4, open **Admin → DebugView** and confirm the same events arrive with their parameters.
4. In GTM, click **Submit → Publish and Create Version**. Name the version something like **Sign Studio GA4 launch**.
5. Check GA4 **Reports → Realtime** after publishing. Standard reports can take longer to populate.

## Events implemented in the app

| Event | When it fires |
| --- | --- |
| `sign_up` | A new visitor submits the email gate successfully |
| `select_item` | A visitor chooses a product from the opening product menu |
| `artwork_upload` | An artwork upload finishes processing successfully |
| `save_design` | A design saves successfully |
| `add_to_cart` | Sign Studio hands a configured product to the Shopify cart |
| `generate_lead` | The design-submission endpoint succeeds |

The analytics guard strips email addresses and blocks customer emails, file names, design names, phone numbers, addresses, and user IDs from the data layer.

`generate_lead` is marked as a GA4 key event. Shopify should own the downstream `begin_checkout` and `purchase` events; configure it with the same GA4 property if full storefront-to-purchase reporting is required.

## Google security hold

Google's malware scanner currently pauses the built-in Google and GA4 Event tags, so events will not reach GA4 until Google clears the flag. Search Console's **Security issues** report shows **No issues detected** for `mysignguy.ca`. Google's guidance is to avoid manually overriding the pause; publish a clean version, allow the automatic rescan, and submit feedback/review if the false positive remains.

## Official references

- <https://support.google.com/analytics/answer/9304153>
- <https://support.google.com/tagmanager/answer/14847097>
- <https://support.google.com/tagmanager/answer/13034206>
- <https://support.google.com/tagmanager/answer/7679219>
- <https://support.google.com/tagmanager/answer/6107163>
- <https://support.google.com/analytics/answer/7201382>
- <https://support.google.com/analytics/answer/13128484>
- <https://support.google.com/tagmanager/answer/6328489>
