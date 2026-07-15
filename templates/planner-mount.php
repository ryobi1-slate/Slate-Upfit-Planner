<?php
/**
 * Front-end mount point for the Slate Upfit Planner React app.
 *
 * Rendered by the `[slate_upfit_planner]` shortcode. The compiled bundle looks
 * for `#slate-upfit-planner-root` and reads bootstrap context from
 * `window.SlateUpfitPlanner` (localized in Plugin::renderPlanner()).
 *
 * @var \Slate\UpfitPlanner\Plugin $this Not available here; template is included in method scope.
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}
?>
<div
    id="slate-upfit-planner-root"
    class="slate-upfit-planner-root"
    data-slate-upfit-planner="1"
>
    <noscript>
        <?php esc_html_e('The Slate Upfit Planner requires JavaScript.', 'slate-upfit-planner'); ?>
    </noscript>
</div>
