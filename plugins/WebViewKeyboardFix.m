#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

// Fixes the blank/black strip that appears after keyboard dismissal inside WKWebView on iOS.
// Uses +load so it self-registers before main() — no AppDelegate changes needed.
@interface WebViewKeyboardFix : NSObject
@end

@implementation WebViewKeyboardFix

+ (void)load {
  [[NSNotificationCenter defaultCenter]
    addObserver:self
    selector:@selector(keyboardWillHide:)
    name:UIKeyboardWillHideNotification
    object:nil];
}

+ (void)keyboardWillHide:(NSNotification *)notification {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableArray<UIWindow *> *windows = [NSMutableArray array];
    if (@available(iOS 15.0, *)) {
      for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
        if ([scene isKindOfClass:[UIWindowScene class]]) {
          [windows addObjectsFromArray:((UIWindowScene *)scene).windows];
        }
      }
    } else {
      [windows addObjectsFromArray:[UIApplication sharedApplication].windows];
    }
    for (UIWindow *window in windows) {
      [WebViewKeyboardFix fixWebViewsInView:window];
    }
  });
}

+ (void)fixWebViewsInView:(UIView *)view {
  if ([view isKindOfClass:[WKWebView class]]) {
    UIScrollView *scrollView = ((WKWebView *)view).scrollView;
    [scrollView setNeedsLayout];
    [scrollView layoutIfNeeded];
    [scrollView setNeedsDisplay];
  }
  for (UIView *subview in view.subviews) {
    [WebViewKeyboardFix fixWebViewsInView:subview];
  }
}

@end
