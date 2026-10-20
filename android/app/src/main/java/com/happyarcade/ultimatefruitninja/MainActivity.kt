package com.happyarcade.ultimatefruitninja

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make window hardware accelerated and keep screen on during gameplay
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Fullscreen setup
        hideSystemUI()

        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Ensure smooth 60fps rendering
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                hideSystemUI()
            }
        }

        webView.webChromeClient = WebChromeClient()

        // Load the local offline game package
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        webView.onResume()
        // Resume game loop inside webview
        webView.evaluateJavascript("if(window.gameEngine && window.gameEngine.state === 'PAUSED') window.gameEngine.resumeGame();", null)
    }

    override fun onPause() {
        super.onPause()
        // Safely pause game loop to preserve battery and score state
        webView.evaluateJavascript("if(window.gameEngine && window.gameEngine.state === 'PLAYING') window.gameEngine.pauseGame();", null)
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Evaluate back navigation inside game
        webView.evaluateJavascript(
            """
            (function() {
                if (window.gameEngine) {
                    if (window.gameEngine.state === 'PLAYING') {
                        window.gameEngine.pauseGame();
                        return true;
                    } else if (window.gameEngine.state === 'PAUSED') {
                        window.gameEngine.showScreen('main-menu');
                        return true;
                    }
                }
                var openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
                if (openModals.length > 0) {
                    openModals.forEach(m => m.classList.add('hidden'));
                    return true;
                }
                return false;
            })();
            """.trimIndent()
        ) { result ->
            if (result == "false" || result == null) {
                super.onBackPressed()
            }
        }
    }
}
