<?php
/**
 * Class for handling plugin assets
 */
class Van_Builder_Assets {

    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }

    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_assets() {
        // Only load on pages with our shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'van_builder')) {
            // Three.js core
            wp_enqueue_script('threejs', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', array('jquery'), null, true);

            // Controls and loaders
            wp_enqueue_script('orbit-controls', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', array('threejs'), null, true);
            wp_enqueue_script('gltf-loader', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', array('threejs'), null, true);
            wp_enqueue_script('draco-loader', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js', array('threejs'), null, true);
            wp_enqueue_script('transform-controls', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js', array('threejs'), null, true);
            wp_enqueue_script('drag-controls', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/DragControls.js', array('threejs'), null, true);

            // Component scripts - ENSURE THESE ARE LOADED BEFORE VAN-BUILDER.JS
            wp_enqueue_script('drag-controls-manager', VAN_BUILDER_ASSETS_URL . 'js/components/drag-controls-manager.js', array('threejs', 'drag-controls'), VAN_BUILDER_VERSION, true);
            // Add the new transform-controls-manager script
            wp_enqueue_script('transform-controls-toolbar', VAN_BUILDER_ASSETS_URL . 'js/components/transform-controls-toolbar.js', array('threejs', 'scene-manager', 'transform-controls'), VAN_BUILDER_VERSION, true);
            wp_enqueue_script('transform-controls-manager', VAN_BUILDER_ASSETS_URL . 'js/components/transform-controls-manager.js', array('threejs', 'transform-controls'), VAN_BUILDER_VERSION, true);
            wp_enqueue_script('scene-manager', VAN_BUILDER_ASSETS_URL . 'js/components/scene-manager.js', array('threejs', 'drag-controls-manager', 'transform-controls-manager'), VAN_BUILDER_VERSION, true);
            wp_enqueue_script('model-loader', VAN_BUILDER_ASSETS_URL . 'js/components/model-loader.js', array('threejs', 'gltf-loader'), VAN_BUILDER_VERSION, true);
            wp_enqueue_script('interaction-manager', VAN_BUILDER_ASSETS_URL . 'js/components/interaction-manager.js', array('threejs', 'transform-controls'), VAN_BUILDER_VERSION, true);
            wp_enqueue_script('ui-controls', VAN_BUILDER_ASSETS_URL . 'js/components/ui-controls.js', array('jquery'), VAN_BUILDER_VERSION, true);

            // Your plugin scripts
            wp_enqueue_script('van-builder-js', VAN_BUILDER_ASSETS_URL . 'js/van-builder.js', array('jquery', 'threejs', 'scene-manager', 'ui-controls', 'model-loader', 'interaction-manager'), VAN_BUILDER_VERSION, true);
            wp_enqueue_style('van-builder-css', VAN_BUILDER_ASSETS_URL . 'css/van-builder.css', array(), VAN_BUILDER_VERSION);
            
            // Add the new frontpage CSS
            wp_enqueue_style('van-builder-frontpage-css', VAN_BUILDER_ASSETS_URL . 'css/frontpage.css', array('van-builder-css'), VAN_BUILDER_VERSION);

            // Pass data to JavaScript
            $available_models = Van_Builder_Models::get_available_models();
            
            // Get frontpage setting from options
            $options = get_option('van_builder_general_settings', array());
            $frontpage_enabled = isset($options['show_frontpage_default']) ? filter_var($options['show_frontpage_default'], FILTER_VALIDATE_BOOLEAN) : true;
            
            wp_localize_script('van-builder-js', 'vanBuilderData', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('van_builder_nonce'),
                'pluginUrl' => VAN_BUILDER_PLUGIN_URL,
                'assetsUrl' => VAN_BUILDER_ASSETS_URL,
                'modelsUrl' => VAN_BUILDER_MODELS_URL,
                'availableModels' => $available_models,
                'frontpageEnabled' => $frontpage_enabled // Add the frontpage flag
            ));
        }
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin's settings page
        if ($hook != 'toplevel_page_van_builder_settings') {
            return;
        }

        wp_enqueue_style('van-builder-admin-css', VAN_BUILDER_ASSETS_URL . 'css/admin.css', array(), VAN_BUILDER_VERSION);
        wp_enqueue_script('van-builder-admin-js', VAN_BUILDER_ASSETS_URL . 'js/admin.js', array('jquery'), VAN_BUILDER_VERSION, true);
        
        // Pass data to JavaScript
        wp_localize_script('van-builder-admin-js', 'vanBuilderAdminData', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('van_builder_admin_nonce'),
            'pluginUrl' => VAN_BUILDER_PLUGIN_URL
        ));
    }
}